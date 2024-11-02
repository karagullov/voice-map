// App.tsx
import React, { useState, useEffect } from 'react';
import Map from './Map';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const App: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [directions, setDirections] = useState<string[]>([]);
  const [currentDirectionIndex, setCurrentDirectionIndex] = useState(0);

  // Получение текущего местоположения пользователя
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([longitude, latitude]); // Установить местоположение пользователя динамически
      }, (error) => {
        console.error("Ошибка получения местоположения пользователя:", error);
      });
    } else {
      console.error("Геолокация не поддерживается этим браузером.");
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'ru-RU'; // Установите язык на русский

    recognition.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];

      // Проверка на наличие последнего результата
      if (lastResult && lastResult.isFinal) {
        const transcript = lastResult[0].transcript.trim().toLowerCase();

        // Слушаем команду для навигации к Центральной площади
        if (transcript.includes('навигация к центральной площади')) {
          if (userLocation) {
            const centralSquareCoordinates: [number, number] = [74.6052, 42.8746]; // Координаты Центральной площади
            setDestination(centralSquareCoordinates);
            speechSynthesis.speak(new SpeechSynthesisUtterance('Навигация к Центральной площади.'));
          } else {
            speechSynthesis.speak(new SpeechSynthesisUtterance('Не удалось определить ваше текущее местоположение.'));
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Ошибка распознавания речи', event);
    };

    recognition.start();

    return () => {
      recognition.stop();
    };
  }, [userLocation]); // Добавить userLocation в зависимости

  // Обработка доступных направлений от компонента карты
  const handleDirectionsAvailable = (newDirections: string[]) => {
    setDirections(newDirections);
    setCurrentDirectionIndex(0); // Сброс индекса, чтобы начать с первого направления

    // Проговорить первое указание
    if (newDirections.length > 0) {
      speechSynthesis.speak(new SpeechSynthesisUtterance(newDirections[0]));
    }
  };

  // Эффект, чтобы дать последующие направления
  useEffect(() => {
    if (directions.length > 0 && currentDirectionIndex < directions.length) {
      const currentDirection = directions[currentDirectionIndex];
      const utterance = new SpeechSynthesisUtterance(currentDirection);

      // Как только текущее указание закончится, перейти к следующему
      utterance.onend = () => {
        setCurrentDirectionIndex(prevIndex => prevIndex + 1);
      };

      speechSynthesis.speak(utterance);
    }
  }, [directions, currentDirectionIndex]);

  return (
    <div>
      <h1>Доступная навигация</h1>
      <Map userLocation={userLocation} destination={destination} onDirectionsAvailable={handleDirectionsAvailable} />
      <p>Скажите "навигация к центральной площади", чтобы начать навигацию.</p>
    </div>
  );
};

export default App;
