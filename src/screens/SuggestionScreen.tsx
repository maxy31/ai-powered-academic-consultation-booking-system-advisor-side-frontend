import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import axios from 'axios';
import { useRoute } from '@react-navigation/native';

interface AppointmentSuggestion {
  day_of_week: string;
  start_time: string;
  end_time: string;
}

const SuggestionScreen = () => {
  const route = useRoute();
  const { userId } = route.params as { userId: number };

  const [suggestions, setSuggestions] = useState<AppointmentSuggestion[]>([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await axios.get(`http://<YOUR-IP>:8080/api/appointments/suggest/${userId}`);
        setSuggestions(res.data);
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      }
    };
    fetchSuggestions();
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Recommended Appointment Slots</Text>
      <FlatList
        data={suggestions}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <Text style={{ fontSize: 16, marginVertical: 5 }}>
            📅 {item.day_of_week} {item.start_time} - {item.end_time}
          </Text>
        )}
      />
    </View>
  );
};

export default SuggestionScreen;
