import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "../styles/StatsPage.css";

function StatsPage() {
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState(null);

  const [inputName, setInputName] = useState(searchParams.get("name") || "");
  const [inputTagline, setInputTagline] = useState(searchParams.get("tagline") || "");
  const [inputRegion, setInputRegion] = useState(searchParams.get("region") || "eun1");

  useEffect(() => {
    const fetchStats = async () => {
      const name = searchParams.get("name");
      const tagline = searchParams.get("tagline");
      const region = searchParams.get("region");
      const response = await fetch(
        `/api/stats?name=${encodeURIComponent(name)}&tagline=${encodeURIComponent(tagline)}&region=${region}`
      );
      const data = await response.json();
  
      console.log("Otrzymane dane:", data);
  
      setStats(data);
    };
  
    fetchStats();
  }, [searchParams]);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="stats-container">
    <form className="search-bar"
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        params.set("name", inputName);
        params.set("tagline", inputTagline);
        params.set("region", inputRegion);
        window.location.search = params.toString();
      }}
      
    >
    <input
      type="text"
      name="name"
      placeholder="Summoner Name"
      value={inputName}
      onChange={(e) => setInputName(e.target.value)}
      required
    />
    <input
      type="text"
      name="tagline"
      placeholder="Tag"
      value={inputTagline}
      onChange={(e) => setInputTagline(e.target.value)}
      required
    />
    <select name="region" value={inputRegion} onChange={(e) => setInputRegion(e.target.value)}>
      <option value="eun1">EUNE</option>
      <option value="euw1">EUW</option>
      <option value="na1">NA</option>
      <option value="kr">KR</option>
    </select>
    <button type="submit">Szukaj</button>
  </form>

      <h1>{stats.name}#{stats.tagline}</h1>

      <div className="profile-info">
        <img
          src={`https://ddragon.leagueoflegends.com/cdn/14.9.1/img/profileicon/${stats.profileIconId}.png`}
          alt="Summoner Icon"
          className="profile-icon"
        />
        <p>Level: {stats.summonerLevel}</p>
      </div>

      {stats.rank && stats.rank.tier ? (
        <div className="rank-info">
          <h2>Ranked Info</h2>
          <p>
            {stats.rank.queueType === "RANKED_SOLO_5x5" ? "Solo/Duo" : "Flex"}:{" "}
            {stats.rank.tier} {stats.rank.rank} – {stats.rank.leaguePoints} LP
          </p>
          <p>
            Wins: {stats.rank.wins} | Losses: {stats.rank.losses}
          </p>
          <p>
            Winrate: {((stats.rank.wins / (stats.rank.wins + stats.rank.losses)) * 100).toFixed(1)}%
          </p>
      </div>
) : (
  <p>Unranked</p>
)}


      <h2>Top mastery points:</h2>
      <div className="champion-info">
        {stats.topChampion ? (
          <div>
            <p>{stats.topChampion.name} – {stats.topChampion.points} points</p>
            <img
              src={`https://ddragon.leagueoflegends.com/cdn/14.9.1/img/champion/${stats.topChampion.image}`}
              alt={stats.topChampion.name}
            />
          </div>
        ) : (
          <p>No info about mastery points.</p>
        )}
      </div>

      <h2>Last matches:</h2>
      <ul className="match-list">
        {stats.recentMatches && stats.recentMatches.map((match, index) => (
          <li key={index} className="match-item">
            <img
              src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/champion/${match.championName}.png`}
              alt={match.championName}
              className="champion-icon"
            />
            <div className="match-details">
              <strong>{match.championName}</strong> 
              <em>
                {match.kills}/{match.deaths}/{match.assists} –{" "}
                <span className={match.win ? "win" : "loss"}>
                  {match.win ? "Win" : "Loss"}<br />
                </span>
              </em>
              <em>{match.date} – {match.queueType} ({match.gameMode})</em>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StatsPage;
