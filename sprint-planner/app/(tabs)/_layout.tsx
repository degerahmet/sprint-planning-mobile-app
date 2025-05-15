import 'react-native-url-polyfill/auto';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, Text, ActivityIndicator, FlatList } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useEmployees, useSprints, useTasks } from '@/utils/supabase';

// Add explicit types for RenderData props
interface RenderDataProps {
  title: string;
  data: any[] | null;
  isLoading: boolean;
  error: Error | null;
}

function RenderData({ title, data, isLoading, error }: RenderDataProps) {
  if (isLoading) return <ActivityIndicator size="large" color="blue" />;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <View>
      <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{title}</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text>{JSON.stringify(item)}</Text>
        )}
      />
    </View>
  );
}

// Fix children prop issue by wrapping in a component
function HomeTab() {
  const { data: employees, isLoading: employeesLoading, error: employeesError } = useEmployees();
  const { data: sprints, isLoading: sprintsLoading, error: sprintsError } = useSprints();
  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useTasks();

  return (
    <View>
      <RenderData title="Employees" data={employees} isLoading={employeesLoading} error={employeesError} />
      <RenderData title="Sprints" data={sprints} isLoading={sprintsLoading} error={sprintsError} />
      <RenderData title="Tasks" data={tasks} isLoading={tasksLoading} error={tasksError} />
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // Replace shadow* with boxShadow
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
        children={HomeTab}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
