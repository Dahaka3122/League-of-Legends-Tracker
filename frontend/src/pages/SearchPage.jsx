import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SearchPage.css";

function SearchPage() {
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [region, setRegion] = useState("euw1");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`/stats?name=${name}&tagline=${tagline}&region=${region}`);
  };

  return (
    <div className="search-page">
      <h1>League of Legends Tracker</h1>
      <form className="search-form" onSubmit={handleSubmit}>
        <input
          name="name"
          type="text"
          placeholder="Username"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          name="tagline"
          type="text"
          placeholder="Tag"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          required
        />
        <select name="region" value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="euw1">EUW</option>
          <option value="na1">NA</option>
          <option value="eun1">EUNE</option>
          <option value="kr">KR</option>
        </select>
        <button type="submit">Search</button>
      </form>
    </div>
  );
}

export default SearchPage;