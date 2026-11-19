import React, { useEffect, useState } from 'react';
import {
  LineChart,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Dashboard.css';
import useAuthStore from '../store/useAuthStore';
import { apiUrl } from '../lib/api';

type ChartData = {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type MealTotals = { calories: number; protein: number; carbs: number; fat: number };
type TodayByType = { breakfast: MealTotals; lunch: MealTotals; dinner: MealTotals; snack: MealTotals };
type DRV = { dailyCalories: number; dailyProtein: number; dailyCarbs: number; dailyFat: number };

type BarRow = {
  macro: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  snack: number;
  target: number;
};

const Dashboard: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const history = useHistory();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [barData, setBarData] = useState<BarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [barLoading, setBarLoading] = useState(true);

  useEffect(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const fetchData = async () => {
      try {
        const response = await fetch(apiUrl('meal'), {
          method: 'GET',
          headers,
        });
        if (response.ok) {
          const data: ChartData[] = await response.json();
          const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
          setChartData(sorted);
        }
      } catch (error) {
        console.error('Error fetching trend meals:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchBarData = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];

        const [drvRes, mealsRes] = await Promise.all([
          fetch(apiUrl('survey/me'), { headers }),
          fetch(`${apiUrl('meal/today-by-type')}?date=${todayStr}`, { headers }),
        ]);

        const drv: DRV = drvRes.ok
          ? await drvRes.json()
          : { dailyCalories: 2000, dailyProtein: 100, dailyCarbs: 250, dailyFat: 65 };

        const meals: TodayByType = mealsRes.ok
          ? await mealsRes.json()
          : {
              breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0 },
              lunch: { calories: 0, protein: 0, carbs: 0, fat: 0 },
              dinner: { calories: 0, protein: 0, carbs: 0, fat: 0 },
              snack: { calories: 0, protein: 0, carbs: 0, fat: 0 },
            };

        const rows: BarRow[] = [
          {
            macro: 'Calories',
            breakfast: drv.dailyCalories ? Number(((meals.breakfast.calories / drv.dailyCalories) * 100).toFixed(1)) : 0,
            lunch: drv.dailyCalories ? Number(((meals.lunch.calories / drv.dailyCalories) * 100).toFixed(1)) : 0,
            dinner: drv.dailyCalories ? Number(((meals.dinner.calories / drv.dailyCalories) * 100).toFixed(1)) : 0,
            snack: drv.dailyCalories ? Number(((meals.snack.calories / drv.dailyCalories) * 100).toFixed(1)) : 0,
            target: 100,
          },
          {
            macro: 'Protein',
            breakfast: drv.dailyProtein ? Number(((meals.breakfast.protein / drv.dailyProtein) * 100).toFixed(1)) : 0,
            lunch: drv.dailyProtein ? Number(((meals.lunch.protein / drv.dailyProtein) * 100).toFixed(1)) : 0,
            dinner: drv.dailyProtein ? Number(((meals.dinner.protein / drv.dailyProtein) * 100).toFixed(1)) : 0,
            snack: drv.dailyProtein ? Number(((meals.snack.protein / drv.dailyProtein) * 100).toFixed(1)) : 0,
            target: 100,
          },
          {
            macro: 'Carbs',
            breakfast: drv.dailyCarbs ? Number(((meals.breakfast.carbs / drv.dailyCarbs) * 100).toFixed(1)) : 0,
            lunch: drv.dailyCarbs ? Number(((meals.lunch.carbs / drv.dailyCarbs) * 100).toFixed(1)) : 0,
            dinner: drv.dailyCarbs ? Number(((meals.dinner.carbs / drv.dailyCarbs) * 100).toFixed(1)) : 0,
            snack: drv.dailyCarbs ? Number(((meals.snack.carbs / drv.dailyCarbs) * 100).toFixed(1)) : 0,
            target: 100,
          },
          {
            macro: 'Fat',
            breakfast: drv.dailyFat ? Number(((meals.breakfast.fat / drv.dailyFat) * 100).toFixed(1)) : 0,
            lunch: drv.dailyFat ? Number(((meals.lunch.fat / drv.dailyFat) * 100).toFixed(1)) : 0,
            dinner: drv.dailyFat ? Number(((meals.dinner.fat / drv.dailyFat) * 100).toFixed(1)) : 0,
            snack: drv.dailyFat ? Number(((meals.snack.fat / drv.dailyFat) * 100).toFixed(1)) : 0,
            target: 100,
          },
        ];

        setBarData(rows);
      } catch (error) {
        console.error('Error fetching dashboard bar data:', error);
      } finally {
        setBarLoading(false);
      }
    };

    void fetchData();
    void fetchBarData();
  }, [token]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonButtons slot="start">
            <IonButton onClick={() => history.push('/home')}>Home</IonButton>
          </IonButtons>
          <IonTitle>Dashboard</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/meal')}>+ Add Meal</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="dashboard-content" fullscreen>
        <div className="charts-row">
          {/* Macros over Time */}
          <div className="chart-card">
            <IonTitle size="small">Macros over Time</IonTitle>
            <div className="chart-card-body">
              {loading ? (
                <div className="chart-loading">Loading real macro data...</div>
              ) : chartData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <p>No meals recorded yet.</p>
                  <IonButton size="small" color="success" onClick={() => history.push('/meal')}>
                    + Log Your First Meal
                  </IonButton>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis width={45} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="protein" stroke="#3b82f6" dot={{ fill: '#3b82f6' }} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="carbs" stroke="#22c55e" dot={{ fill: '#22c55e' }} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="fat" stroke="#ef4444" dot={{ fill: '#ef4444' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Calories over Time */}
          <div className="chart-card">
            <IonTitle size="small">Calories over Time</IonTitle>
            <div className="chart-card-body">
              {loading ? (
                <div className="chart-loading">Loading calorie data...</div>
              ) : chartData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <p>No calorie history yet.</p>
                  <IonButton size="small" color="success" onClick={() => history.push('/meal')}>
                    + Log Your First Meal
                  </IonButton>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis width={45} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="calories" stroke="#f97316" dot={{ fill: '#f97316' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Today vs. Daily Goals */}
          <div className="chart-card">
            <IonTitle size="small">Today vs. Daily Goals (% of target)</IonTitle>
            <div className="chart-card-body">
              {barLoading ? (
                <div className="chart-loading">Loading daily progress...</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={barData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="macro" />
                    <YAxis unit="%" domain={[0, 150]} allowDataOverflow />
                    <Tooltip formatter={(value: number) => `${Number(value).toFixed(0)}%`} />
                    <Legend />
                    <Bar dataKey="breakfast" stackId="a" fill="#f97316" />
                    <Bar dataKey="lunch" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="dinner" stackId="a" fill="#22c55e" />
                    <Bar dataKey="snack" stackId="a" fill="#a855f7" />
                    <Line dataKey="target" stroke="#000" strokeWidth={2} dot={{ r: 5 }} name="Daily Goal (100%)" />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
