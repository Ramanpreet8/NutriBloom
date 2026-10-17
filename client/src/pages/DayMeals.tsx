import React, { useEffect, useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/react';

type MealItem = {
  id: string;
  foodName: string;
  portion: string;
};

type Meal = {
  id: string;
  mealType: string;
  items: MealItem[];
};

const DayMeals: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
  const [meals, setMeals] = useState<Meal[]>([]);
  const [filter, setFilter] = useState('General');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDayMeals = async () => {
      setLoading(true);
      setError(null);

      try {
        const query = filter === 'General' ? '' : `?dietType=${encodeURIComponent(filter)}`;
        const response = await fetch(`${apiUrl}/day-meals${query}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch meals (${response.status})`);
        }

        const data: Meal[] = await response.json();
        console.log(data);
        setMeals(data);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch meals');
      } finally {
        setLoading(false);
      }
    };

    void fetchDayMeals();
  }, [apiUrl, filter]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>NutriBloom</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent>
            <h1>Today's Meals</h1>
            <p>Plan your meals for the day and stay on track with your goals.</p>

            <IonItem>
              <IonLabel>Diet type</IonLabel>
              <IonSelect
                value={filter}
                onIonChange={(event) => setFilter(event.detail.value)}
                aria-label="Filter meals by diet type"
              >
                <IonSelectOption value="General">All Meals</IonSelectOption>
                <IonSelectOption value="Vegetarian">Vegetarian</IonSelectOption>
                <IonSelectOption value="Vegan">Vegan</IonSelectOption>
                <IonSelectOption value="High-Protein">High Protein</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonList>
              {loading && (
                <IonItem>
                  <IonLabel>Loading meals...</IonLabel>
                </IonItem>
              )}
              {error && (
                <IonItem>
                  <IonLabel color="danger">{error}</IonLabel>
                </IonItem>
              )}
              {!loading && !error && meals.length === 0 && (
                <IonItem>
                  <IonLabel>No meals found for today.</IonLabel>
                </IonItem>
              )}
              {!loading && !error && meals.map((meal) => (
                <IonItem key={meal.id} lines="full">
                  <IonLabel>
                    <h2>{meal.mealType}</h2>
                    <p>
                      {meal.items.length > 0
                        ? meal.items.map((item) => `${item.foodName} (${item.portion})`).join(', ')
                        : 'No items'}
                    </p>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>

            <IonButton expand="block" color="success">
              Save Day Plan
            </IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default DayMeals;
