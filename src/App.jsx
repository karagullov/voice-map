//@ts-ignore
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import "leaflet/dist/leaflet.css";

const RoutingControlWithVoice = ({ currentLocation, destinationCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (currentLocation && destinationCoords) {
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(currentLocation.lat, currentLocation.lng),
          L.latLng(destinationCoords.lat, destinationCoords.lng),
        ],
        routeWhileDragging: false,
        language: "ru",
        createMarker: () => null,
      }).addTo(map);

      // Listen for routing events to start voice guidance
      routingControl.on("routesfound", (e) => {
        const route = e.routes[0];
        const instructions = route.instructions;
        instructions[0].text="Построен маршрут до Центральной площади, время пути займёт 15 минут."+instructions[0].text
        instructions[1].text=instructions[1].text+"Через 10 метров есть речка. Будьте осторожны."
        instructions[2].text=instructions[2].text+"За углом на левой стороне дороги есть большая яма, обойдите дорогу с правой стороны."
        instructions[3].text=instructions[3].text+"На перекрёстке нет светофора. Обязательно попросите людей, чтобы помогли вам перейти дорогу."



        // Function to read each instruction out loud
        let currentStep = 0;
        const readInstruction = () => {
          if (currentStep < instructions.length) {
            const text = instructions[currentStep].text;
            const utterance = new SpeechSynthesisUtterance(text);
            console.log(text);
            
            utterance.lang = "ru-RU";
            utterance.onend = () => {
              currentStep++;
              setTimeout(readInstruction, 10000); // Wait 10 seconds before the next instruction
            };
            window.speechSynthesis.speak(utterance);
          }
        };

        // Start reading instructions
        readInstruction();
      });

      return () => map.removeControl(routingControl);
    }
  }, [map, currentLocation, destinationCoords]);

  return null;
};

const App = () => {
  const [destination, setDestination] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const { transcript, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const handleVoiceInput = () => {
    SpeechRecognition.startListening({ continuous: true, language: "ru-RU" });
  };

  useEffect(() => {
    if (transcript) {
      const loweredTranscript = transcript.toLowerCase();
      if (loweredTranscript.includes("центральная площадь")) {
        setDestination("Центральная площадь");
        setDestinationCoords({ lat: 42.876, lng: 74.607 });
        resetTranscript();
      }
    }
  }, [transcript, resetTranscript]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h1>Навигация для незрячих</h1>
      <button onClick={handleVoiceInput}>Скажите, куда вы хотите направиться</button>
      <p>Ваш запрос: {transcript}</p>
      <p>Назначение: {destination}</p>

      {currentLocation && (
        <MapContainer
          center={[currentLocation.lat, currentLocation.lng]}
          zoom={15}
          style={{ height: "600px", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={[currentLocation.lat, currentLocation.lng]} />
          {destinationCoords && (
            <RoutingControlWithVoice
              currentLocation={currentLocation}
              destinationCoords={destinationCoords}
            />
          )}
        </MapContainer>
      )}
    </div>
  );
};

export default App;
