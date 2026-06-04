import React, { useState } from "react";
import Home from "./Home";
import CityPage from "./CityPage";

export interface CityData {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export default function App() {
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);

  return selectedCity ? (
    <CityPage city={selectedCity} onBack={() => setSelectedCity(null)} />
  ) : (
    <Home onCitySelect={setSelectedCity} />
  );
}
