export interface AppointmentSuggestion {
  day_of_week: string;
  start_time: string;
  end_time: string;
}

export interface NavigationProps {
  route: {
    params: {
      userId: number;
      timetableId: number;
    };
  };
  navigation: any;
}