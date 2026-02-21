'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { apiGet, apiPatch } from '@/lib/api';
import { toast } from '@/components/ui/Toaster';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock,
  Save,
  Loader2,
  Shield,
  Home
} from 'lucide-react';
import { Role } from '@pazo/shared';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone: string | null;
  street: string | null;
  city: string | null;
  createdAt: string;
}

const roleLabels: Record<Role, string> = {
  [Role.KUNDE]: 'Kunde',
  [Role.BAECKER]: 'Bäcker',
  [Role.LIEFERANT]: 'Lieferant',
  [Role.ADMIN]: 'Administrator',
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, setUser } = useAuthStore();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Formular-State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  
  // Passwort-Formular
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Auth-Check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('Bitte melden Sie sich an');
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Profil laden
  useEffect(() => {
    async function fetchProfile() {
      if (!isAuthenticated) return;
      
      try {
        const response = await apiGet<{ success: boolean; data: UserProfile }>('/api/auth/me');
        setProfile(response.data);
        setName(response.data.name);
        setPhone(response.data.phone || '');
        setStreet(response.data.street || '');
        setCity(response.data.city || '');
      } catch (error: any) {
        toast.error(error.message || 'Fehler beim Laden des Profils');
      } finally {
        setIsLoading(false);
      }
    }

    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated]);

  // Profil speichern
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Name ist erforderlich');
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiPatch<{ success: boolean; data: UserProfile; message: string }>(
        '/api/auth/profile',
        {
          name: name.trim(),
          phone: phone.trim() || null,
          street: street.trim() || null,
          city: city.trim() || null,
        }
      );
      
      setProfile(response.data);
      setUser({
        id: response.data.id,
        email: response.data.email,
        name: response.data.name,
        role: response.data.role,
      });
      toast.success(response.message || 'Profil aktualisiert');
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  // Passwort ändern
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Neues Passwort muss mindestens 8 Zeichen haben');
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiPatch<{ success: boolean; message: string }>(
        '/api/auth/password',
        {
          currentPassword,
          newPassword,
        }
      );
      
      toast.success('Passwort erfolgreich geändert');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Ändern des Passworts');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Mein Profil</h1>

      {/* Profil-Info Card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{profile.name}</h2>
            <div className="flex items-center gap-2 text-gray-500">
              <Shield className="w-4 h-4" />
              <span>{roleLabels[profile.role]}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile}>
          <div className="space-y-4">
            {/* Email (nicht editierbar) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-2" />
                E-Mail
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="input bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                E-Mail-Adresse kann nicht geändert werden
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-2" />
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Ihr Name"
                required
              />
            </div>

            {/* Telefon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-2" />
                Telefon
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input"
                placeholder="z.B. +49 123 456789"
              />
            </div>

            {/* Straße und Hausnummer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Home className="w-4 h-4 inline mr-2" />
                Straße und Hausnummer
              </label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="input"
                placeholder="z.B. Musterstraße 123"
              />
            </div>

            {/* PLZ und Stadt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-2" />
                PLZ und Stadt
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="input"
                placeholder="z.B. 12345 Musterstadt"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Änderungen speichern
            </button>
          </div>
        </form>
      </div>

      {/* Passwort ändern Card */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Passwort ändern
          </h3>
          {!showPasswordForm && (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Passwort ändern
            </button>
          )}
        </div>

        {showPasswordForm ? (
          <form onSubmit={handleChangePassword}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aktuelles Passwort *
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Neues Passwort *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input"
                  minLength={8}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mindestens 8 Zeichen
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Neues Passwort bestätigen *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="btn-secondary flex-1"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isChangingPassword}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isChangingPassword ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
                Passwort ändern
              </button>
            </div>
          </form>
        ) : (
          <p className="text-gray-500 text-sm">
            Aus Sicherheitsgründen sollten Sie Ihr Passwort regelmäßig ändern.
          </p>
        )}
      </div>

      {/* Account-Info */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          Mitglied seit{' '}
          {new Date(profile.createdAt).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}
