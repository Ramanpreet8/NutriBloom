import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { arrowForwardOutline, flashOutline } from 'ionicons/icons';
import './Login.css';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonList,
  IonItemGroup,
} from '@ionic/react';
import useAuthStore from '../store/useAuthStore';
import { apiUrl } from '../lib/api';

const Login: React.FC = () => {
  const history = useHistory();
  const setToken = useAuthStore((state) => state.setToken);

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);

  const submitLogin = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl('login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();
      if (response.ok && data.token) {
        setToken(data.token);
        history.push('/home');
      } else {
        setErrorMessage(data.message || 'Invalid email or password.');
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('Unable to connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMessage(null);
    setIsDemoSubmitting(true);
    try {
      const response = await fetch(apiUrl('demo-login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (response.ok && data.token) {
        setToken(data.token);
        history.push('/home');
      } else {
        setErrorMessage(data.message || 'Demo login failed.');
      }
    } catch (error) {
      console.error('Demo login error:', error);
      setErrorMessage('Unable to connect to server for demo login.');
    } finally {
      setIsDemoSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonTitle>NutriBloom</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="login-container">
          <h1 className="login-heading">Login</h1>

          <div className="login-card">
            <IonList>
              <IonItemGroup>
                <IonItem>
                  <IonLabel position="stacked" className="form-label">
                    Email:
                  </IonLabel>
                  <IonInput
                    type="email"
                    placeholder="Enter your email"
                    value={loginData.email}
                    onIonChange={(e) =>
                      setLoginData({
                        ...loginData,
                        email: e.detail.value ?? '',
                      })
                    }
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked" className="form-label">
                    Password:
                  </IonLabel>
                  <IonInput
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onIonChange={(e) =>
                      setLoginData({
                        ...loginData,
                        password: e.detail.value ?? '',
                      })
                    }
                  />
                </IonItem>
              </IonItemGroup>
            </IonList>

            {errorMessage && (
              <div
                style={{
                  color: 'var(--ion-color-danger, #eb445a)',
                  margin: '12px 0',
                  textAlign: 'center',
                }}
              >
                {errorMessage}
              </div>
            )}

            <IonButton
              expand="block"
              className="login-button"
              disabled={isSubmitting || isDemoSubmitting}
              onClick={submitLogin}
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </IonButton>

            <div style={{ textAlign: 'center', margin: '14px 0 8px 0', color: 'var(--ion-color-medium, #888)' }}>
              <span>─── OR ───</span>
            </div>

            <IonButton
              expand="block"
              color="secondary"
              fill="solid"
              disabled={isSubmitting || isDemoSubmitting}
              onClick={handleDemoLogin}
            >
              <IonIcon slot="start" icon={flashOutline} />
              {isDemoSubmitting ? 'Starting Demo...' : 'Try Demo Account (Instant Login)'}
            </IonButton>
          </div>

          <IonButton
            className="redirect-button"
            fill="clear"
            onClick={() => history.push('/signup')}
          >
            <IonIcon slot="start" icon={arrowForwardOutline} />
            New User? Sign Up!
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
