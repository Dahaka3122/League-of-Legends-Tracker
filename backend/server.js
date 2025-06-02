const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 5000;

app.use(cors());

const regionMap = {
  "eune": { platform: "eun1", routing: "europe" },
  "eun1": { platform: "eun1", routing: "europe" },
  "euw": { platform: "euw1", routing: "europe" },
  "na": { platform: "na1", routing: "americas" },
  "kr": { platform: "kr", routing: "asia" },
};

const gameModeMap = {
  CLASSIC: "Summoner’s Rift",
  ARAM: "ARAM",
  URF: "Ultra Rapid Fire",
  ONEFORALL: "One For All",
  CHERRY: "Arena",
  TUTORIAL: "Tutorial",
  ASCENSION: "Ascension",
  FIRSTBLOOD: "Snowdown Showdown",
  KINGPORO: "Legend of the Poro King",
  NEXUSBLITZ: "Nexus Blitz",
};

const queueTypeMap = {
  400: "Normal Draft Pick",
  420: "Ranked Solo/Duo",
  440: "Ranked Flex",
  450: "ARAM",
  490: "Normal Quickplay",
  700: "Clash",
  900: "URF",
  1020: "One For All",
  1700: "Arena",
  1300: "Nexus Blitz",
  830: "Co-op vs. AI (Beginner)",
  840: "Co-op vs. AI (Intermediate)",
  850: "Co-op vs. AI (Intro)",
};


let championData = null;

async function loadChampionData() {
  try {
    const versionsRes = await axios.get(
      "https://ddragon.leagueoflegends.com/api/versions.json"
    );
    const latestVersion = versionsRes.data[0];

    const champRes = await axios.get(
      `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`
    );
    championData = champRes.data.data;
    console.log("✅ Champion data załadowane, wersja:", latestVersion);
  } catch (err) {
    console.error("❌ Błąd pobierania champion data:", err.message);
  }
}

loadChampionData();

function getChampionInfo(championId) {
  if (!championData) return null;
  for (const champName in championData) {
    if (parseInt(championData[champName].key) === championId) {
      return {
        name: championData[champName].name,
        image: championData[champName].image.full,
      };
    }
  }
  return null;
}

app.get("/api/stats", async (req, res) => {
  const { name, tagline, region } = req.query;

  const regionInfo = regionMap[region];
  if (!regionInfo) {
    return res.status(400).json({ error: `Nieznany region: ${region}` });
  }
  const platform = regionInfo.platform;
  const routing = regionInfo.routing;

  if (!name || !tagline || !region) {
    return res.status(400).json({ error: "Brak wymaganych parametrów" });
  }
  try {
    console.log("➡️ Otrzymane query params:", { name, tagline, region });
    const platform = regionMap[region]?.platform || region;

    console.log("🔍 Pobieram PUUID...");
    const accountRes = await axios.get(
      `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
        name
      )}/${encodeURIComponent(tagline)}`,
      { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
    );
    const puuid = accountRes.data.puuid;
    console.log("✅ PUUID:", puuid);

    console.log("🔍 Pobieram summoner info...");
    const summonerRes = await axios.get(
      `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
    );
    const summoner = summonerRes.data;
    console.log("✅ Summoner Data:", summoner);

    console.log("🔍 Pobieram rangę...");
    const leagueRes = await axios.get(
      `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}`,
      { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
    );
    const rankedSolo = leagueRes.data.find(
      (q) => q.queueType === "RANKED_SOLO_5x5"
    );
    console.log("✅ Ranga:", rankedSolo ? `${rankedSolo.tier} ${rankedSolo.rank}` : "Unranked");

    console.log("🔍 Pobieram maestrię...");
    let topChampion = null;
    try {
      const masteryRes = await axios.get(
        `https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${summoner.id}`,
        { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
      );
      if (masteryRes.data.length > 0) {
        const top = masteryRes.data[0];
        const champInfo = getChampionInfo(top.championId);
        topChampion = {
          id: top.championId,
          points: top.championPoints,
          name: champInfo ? champInfo.name : "Unknown",
          image: champInfo ? champInfo.image : null,
        };
      }
      console.log("✅ Top champion mastery:", topChampion);
    } catch (e) {
      if (e.response && e.response.status === 403) {
        console.warn("⚠️ Brak dostępu do maestrii postaci (403), pomijam...");
      } else {
        throw e;
      }
    }

    console.log("🔍 Pobieram ostatnie mecze...");
    const matchesRes = await axios.get(
      `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=5`,
      { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
    );
    const matchIds = matchesRes.data;

    const matchesDetails = [];
    for (const matchId of matchIds) {
      const matchRes = await axios.get(
        `https://${regionMap[region].routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
        { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } }
      );

      const participant = matchRes.data.info.participants.find(
        (p) => p.puuid === puuid
      );

      const matchTimestamp = matchRes.data.info.gameStartTimestamp;
      const matchDate = new Date(matchTimestamp).toLocaleString("pl-PL",{
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      matchesDetails.push({
        matchId,
        championName: participant.championName,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        win: participant.win,
        date: matchDate,
        gameMode: gameModeMap[matchRes.data.info.gameMode] || matchRes.data.info.gameMode,
        queueType: queueTypeMap[matchRes.data.info.queueId] || `Queue ID ${matchRes.data.info.queueId}`,
      });
    }

    res.json({
      name,
      tagline,
      profileIconId: summoner.profileIconId,
      summonerLevel: summoner.summonerLevel,
      rank: rankedSolo || null,
      topChampion,
      recentMatches: matchesDetails,
    });
  } catch (err) {
    console.error("❌ Błąd backendu:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      url: err.config?.url,
    });
    res.status(err.response?.status || 500).json({
      error: err.response?.data || "Błąd backendu",
    });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
