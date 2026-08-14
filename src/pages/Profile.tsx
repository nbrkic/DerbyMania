import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { SiteHeader, UserAvatar } from '../components/SiteHeader';
import { Seo } from '../components/Seo';
import { SiteFooter } from '../components/SiteFooter';
import { TicketField, SelectField, ComboboxField, MultiSelectPills, UsernameField, USERNAME_REGEX, type UsernameStatus } from '../components/AuthShell';
import { normalizeForSearch } from '../lib/text';
import {
  FOOTBALL_SPORT_NAMES,
  BASKETBALL_SPORT_NAMES,
  FOOTBALL_POSITION_OPTIONS,
  BASKETBALL_POSITION_OPTIONS,
  FOOTBALL_POSITION_VALUES,
  BASKETBALL_POSITION_VALUES,
} from '../lib/positions';
import { TeamRow, type Team } from './Teams';
import { TournamentRow, type Tournament } from './Tournaments';
import { RowSkeletonGrid } from '../components/Skeleton';
import { compressImage, CREST_MAX_DIMENSION } from '../lib/imageCompression';
import { ImageCropper } from '../components/ImageCropper';
import { ProfileTutorial, type TutorialStep } from '../components/ProfileTutorial';

const TUTORIAL_DONE_KEY = 'dm_profile_tutorial_done';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="14" r="3.5" />
    </svg>
  );
}

type SavedValues = {
  fullName: string;
  username: string;
  birthDate: string;
  phone: string;
  city: string;
  email: string;
  dominantHand: string;
  dominantLeg: string;
  heightCm: string;
  weightKg: string;
  positions: string[];
  sportIds: number[];
};

type Sport = { id: number; name: string };

const DOMINANT_OPTIONS = [
  { value: 'levak', label: 'Leva' },
  { value: 'desnjak', label: 'Desna' },
  { value: 'oba', label: 'Obe' },
];

function sameIds(a: number[], b: number[]) {
  return a.length === b.length && [...a].sort().join(',') === [...b].sort().join(',');
}

function samePositions(a: string[], b: string[]) {
  return a.length === b.length && [...a].sort().join(',') === [...b].sort().join(',');
}

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const seededRef = useRef(false);
  const errorRef = useRef<HTMLParagraphElement>(null);

  // Elementi koje mini-tutorijal redom ističe.
  const avatarRef = useRef<HTMLButtonElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const sportsRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef<HTMLDivElement>(null);
  const weightRef = useRef<HTMLDivElement>(null);
  const footballPositionsRef = useRef<HTMLDivElement>(null);
  const dominantLegRef = useRef<HTMLDivElement>(null);
  const basketballPositionsRef = useRef<HTMLDivElement>(null);
  const dominantHandRef = useRef<HTMLDivElement>(null);

  const [showTutorial, setShowTutorial] = useState(false);

  // Pokreni tutorijal posle registracije (state iz Register-a) ili ručno preko
  // ?tour=1 (za pregled). Registracioni put poštuje „već odgledano" iz localStorage.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const forced = params.get('tour') === '1';
    const fromRegister = (location.state as { tutorial?: boolean } | null)?.tutorial === true;
    const done = typeof window !== 'undefined' && localStorage.getItem(TUTORIAL_DONE_KEY) === '1';
    if (forced || (fromRegister && !done)) setShowTutorial(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function closeTutorial() {
    localStorage.setItem(TUTORIAL_DONE_KEY, '1');
    setShowTutorial(false);
    // Očisti state/query da osvežavanje stranice ponovo ne otvori tutorijal.
    navigate('/profile', { replace: true });
  }

  // Poslednji korak tutorijala: zatvori ga i odmah pokušaj da sačuvaš profil.
  // Ako nešto nije ispravno, ponaša se kao običan „Sačuvaj" (inline greške ostaju)
  // i odvede korisnika do prvog neispravnog polja da ga popravi.
  async function finishTutorial() {
    closeTutorial();
    const ok = await saveProfile();
    if (!ok) {
      const errs = getFieldErrors() as Record<string, string | undefined>;
      const firstInvalidId = ['fullName', 'username', 'city', 'heightCm', 'weightKg'].find((id) => errs[id]);
      if (firstInvalidId) {
        setTimeout(() => {
          document.getElementById(firstInvalidId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 60);
      }
    }
  }

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState('avatar.jpg');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [dominantHand, setDominantHand] = useState('');
  const [dominantLeg, setDominantLeg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [positions, setPositions] = useState<string[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [selectedSportIds, setSelectedSportIds] = useState<number[]>([]);
  const [sportsLoaded, setSportsLoaded] = useState(false);
  const [saved, setSaved] = useState<SavedValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [memberTeams, setMemberTeams] = useState<Team[]>([]);
  const [loadingMemberTeams, setLoadingMemberTeams] = useState(true);
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [participatedTournaments, setParticipatedTournaments] = useState<Tournament[]>([]);
  const [loadingParticipatedTournaments, setLoadingParticipatedTournaments] = useState(true);

  useEffect(() => {
    supabase
      .from('sports')
      .select('id, name')
      .order('name')
      .then(({ data }) => setSports(data ?? []));
  }, []);

  useEffect(() => {
    supabase
      .from('city')
      .select('id, name')
      .then(({ data }) => {
        const rows = (data ?? []).slice().sort((a, b) => a.name.localeCompare(b.name, 'sr'));
        setCities(rows);
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profile_preferred_sports')
      .select('sport_id')
      .eq('profile_id', user.id)
      .then(({ data }) => {
        setSelectedSportIds((data ?? []).map((r) => r.sport_id));
        setSportsLoaded(true);
      });
  }, [user]);

  useEffect(() => {
    if (!seededRef.current && profile && user && sportsLoaded) {
      const initial: SavedValues = {
        fullName: profile.full_name ?? '',
        username: profile.username ?? '',
        birthDate: profile.birth_date ?? '',
        phone: profile.phone ?? '',
        city: profile.city ?? '',
        email: user.email ?? '',
        dominantHand: profile.dominant_hand ?? '',
        dominantLeg: profile.dominant_leg ?? '',
        heightCm: profile.height_cm != null ? String(profile.height_cm) : '',
        weightKg: profile.weight_kg != null ? String(profile.weight_kg) : '',
        positions: profile.preferred_positions ?? [],
        sportIds: selectedSportIds,
      };
      setFullName(initial.fullName);
      setUsername(initial.username);
      setBirthDate(initial.birthDate);
      setPhone(initial.phone);
      setCity(initial.city);
      setEmail(initial.email);
      setDominantHand(initial.dominantHand);
      setDominantLeg(initial.dominantLeg);
      setHeightCm(initial.heightCm);
      setWeightKg(initial.weightKg);
      setPositions(initial.positions);
      setSaved(initial);
      seededRef.current = true;
    }
  }, [profile, user, sportsLoaded, selectedSportIds]);

  const hasChanges =
    !!avatarFile ||
    (saved !== null &&
      (fullName !== saved.fullName ||
        username !== saved.username ||
        birthDate !== saved.birthDate ||
        phone !== saved.phone ||
        city !== saved.city ||
        email !== saved.email ||
        dominantHand !== saved.dominantHand ||
        dominantLeg !== saved.dominantLeg ||
        heightCm !== saved.heightCm ||
        weightKg !== saved.weightKg ||
        !samePositions(positions, saved.positions) ||
        !sameIds(selectedSportIds, saved.sportIds)));

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  useEffect(() => {
    if (!user) return;

    async function loadMyTeams() {
      const { data } = await supabase
        .from('teams')
        .select('id, owner_id, name, crest_url, crest_position_x, crest_position_y, banner_url, city, founded_year, sport_id, sports(name)')
        .eq('owner_id', user!.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      const rows = (data as unknown as Omit<Team, 'founderName' | 'playerCount'>[]) ?? [];

      const teamIds = rows.map((t) => t.id);
      const { data: memberRows } = teamIds.length
        ? await supabase.from('team_members').select('team_id').in('team_id', teamIds)
        : { data: [] as { team_id: string }[] };

      const countByTeam = new Map<string, number>();
      (memberRows ?? []).forEach((m) => countByTeam.set(m.team_id, (countByTeam.get(m.team_id) ?? 0) + 1));

      setMyTeams(rows.map((t) => ({ ...t, founderName: null, playerCount: countByTeam.get(t.id) ?? 0 })));
      setLoadingTeams(false);
    }

    loadMyTeams();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    async function loadMemberTeams() {
      const { data: membershipRows } = await supabase.from('team_members').select('team_id').eq('user_id', user!.id);
      const teamIds = (membershipRows ?? []).map((m) => m.team_id);

      if (!teamIds.length) {
        setMemberTeams([]);
        setLoadingMemberTeams(false);
        return;
      }

      const { data } = await supabase
        .from('teams')
        .select('id, owner_id, name, crest_url, crest_position_x, crest_position_y, banner_url, city, founded_year, sport_id, sports(name)')
        .in('id', teamIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      const rows = (data as unknown as Omit<Team, 'founderName' | 'playerCount'>[]) ?? [];

      const ownerIds = [...new Set(rows.map((t) => t.owner_id))];
      const { data: founders } = ownerIds.length
        ? await supabase.from('public_profiles').select('id, full_name').in('id', ownerIds)
        : { data: [] as { id: string; full_name: string | null }[] };
      const nameById = new Map((founders ?? []).map((f) => [f.id, f.full_name]));

      const { data: allMemberRows } = await supabase.from('team_members').select('team_id').in('team_id', teamIds);
      const countByTeam = new Map<string, number>();
      (allMemberRows ?? []).forEach((m) => countByTeam.set(m.team_id, (countByTeam.get(m.team_id) ?? 0) + 1));

      setMemberTeams(
        rows.map((t) => ({ ...t, founderName: nameById.get(t.owner_id) ?? null, playerCount: countByTeam.get(t.id) ?? 0 }))
      );
      setLoadingMemberTeams(false);
    }

    loadMemberTeams();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    async function loadMyTournaments() {
      const { data: tournamentRows } = await supabase
        .from('tournaments')
        .select(
          'id, owner_id, name, crest_url, crest_position_x, crest_position_y, banner_url, city, location, start_date, max_teams, sport_id, status, sports(name)'
        )
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false });

      const rows = (tournamentRows as unknown as Omit<Tournament, 'founderName' | 'teamCount'>[]) ?? [];

      const tournamentIds = rows.map((t) => t.id);
      const { data: teamRows } = tournamentIds.length
        ? await supabase.from('tournament_teams').select('tournament_id').in('tournament_id', tournamentIds)
        : { data: [] as { tournament_id: string }[] };

      const countByTournament = new Map<string, number>();
      (teamRows ?? []).forEach((t) => countByTournament.set(t.tournament_id, (countByTournament.get(t.tournament_id) ?? 0) + 1));

      setMyTournaments(rows.map((t) => ({ ...t, founderName: null, teamCount: countByTournament.get(t.id) ?? 0 })));
      setLoadingTournaments(false);
    }

    loadMyTournaments();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    async function loadParticipatedTournaments() {
      const { data: membershipRows } = await supabase.from('team_members').select('team_id').eq('user_id', user!.id);
      const memberTeamIds = (membershipRows ?? []).map((m) => m.team_id);

      if (!memberTeamIds.length) {
        setParticipatedTournaments([]);
        setLoadingParticipatedTournaments(false);
        return;
      }

      const { data: participationRows } = await supabase
        .from('tournament_teams')
        .select('tournament_id')
        .in('team_id', memberTeamIds);
      const tournamentIds = [...new Set((participationRows ?? []).map((p) => p.tournament_id))];

      if (!tournamentIds.length) {
        setParticipatedTournaments([]);
        setLoadingParticipatedTournaments(false);
        return;
      }

      const { data: tournamentRows } = await supabase
        .from('tournaments')
        .select(
          'id, owner_id, name, crest_url, crest_position_x, crest_position_y, banner_url, city, location, start_date, max_teams, sport_id, status, sports(name)'
        )
        .in('id', tournamentIds)
        .order('created_at', { ascending: false });

      const rows = (tournamentRows as unknown as Omit<Tournament, 'founderName' | 'teamCount'>[]) ?? [];

      const ownerIds = [...new Set(rows.map((t) => t.owner_id))];
      const { data: founders } = ownerIds.length
        ? await supabase.from('public_profiles').select('id, full_name').in('id', ownerIds)
        : { data: [] as { id: string; full_name: string | null }[] };
      const nameById = new Map((founders ?? []).map((f) => [f.id, f.full_name]));

      const { data: allTournamentTeamRows } = await supabase
        .from('tournament_teams')
        .select('tournament_id')
        .in('tournament_id', tournamentIds);
      const countByTournament = new Map<string, number>();
      (allTournamentTeamRows ?? []).forEach((t) =>
        countByTournament.set(t.tournament_id, (countByTournament.get(t.tournament_id) ?? 0) + 1)
      );

      setParticipatedTournaments(
        rows.map((t) => ({ ...t, founderName: nameById.get(t.owner_id) ?? null, teamCount: countByTournament.get(t.id) ?? 0 }))
      );
      setLoadingParticipatedTournaments(false);
    }

    loadParticipatedTournaments();
  }, [user]);

  type FieldErrors = {
    fullName?: string;
    username?: string;
    city?: string;
    heightCm?: string;
    weightKg?: string;
  };

  function getFieldErrors(): FieldErrors {
    const errors: FieldErrors = {};

    if (!fullName.trim()) {
      errors.fullName = 'Unesi ime i prezime.';
    } else if (!/^[A-Za-zČĆŽŠĐčćžšđ]+(?: [A-Za-zČĆŽŠĐčćžšđ]+)*$/.test(fullName.trim())) {
      errors.fullName = 'Ime i prezime mogu sadržati samo slova i razmak.';
    }

    if (city.trim() && !cities.some((c) => normalizeForSearch(c.name) === normalizeForSearch(city))) {
      errors.city = 'Izaberi grad iz ponuđene liste.';
    }

    if (username && !USERNAME_REGEX.test(username)) {
      errors.username = 'Korisničko ime mora imati najmanje 3 karaktera i sadržati samo slova i brojeve.';
    } else if (username && usernameStatus === 'taken') {
      errors.username = 'Ovo korisničko ime je zauzeto.';
    } else if (username && usernameStatus === 'checking') {
      errors.username = 'Sačekaj da se završi provera dostupnosti korisničkog imena.';
    }

    if (heightCm && (Number(heightCm) < 100 || Number(heightCm) > 250)) {
      errors.heightCm = 'Visina mora biti između 100 i 250 cm.';
    }

    if (weightKg && (Number(weightKg) < 30 || Number(weightKg) > 250)) {
      errors.weightKg = 'Težina mora biti između 30 i 250 kg.';
    }

    return errors;
  }

  const fieldErrors = attempted ? getFieldErrors() : {};

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    // Dozvoli da se ista slika izabere ponovo tako što reset-ujemo vrednost inputa.
    input.value = '';
    setAvatarMenuOpen(false);
    if (!file) return;
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setError('Slika nije ispravnog formata. Dozvoljeni formati su JPG, PNG ili WEBP.');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setError('Slika je prevelika (maksimalno 5MB).');
      return;
    }
    setError(null);
    // Otvori cropper (zoom/pomeranje) umesto direktnog postavljanja slike.
    setCropFileName(file.name);
    setCropSrc(URL.createObjectURL(file));
  }

  function handleCropConfirm(file: File) {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  function openAvatarPicker() {
    // Na dodirnim uređajima (telefon/tablet) ponudi izbor: uslikaj se ili iz galerije,
    // kao na Instagramu. Na desktopu direktno otvori izbor fajla.
    const isTouch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
    if (isTouch) setAvatarMenuOpen(true);
    else fileInputRef.current?.click();
  }

  useEffect(() => {
    if (!avatarMenuOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setAvatarMenuOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [avatarMenuOpen]);

  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    await saveProfile();
  }

  // Sačuvaj profil. Vraća true ako je uspešno sačuvano, false ako podaci nisu
  // ispravni ili je došlo do greške (koriste ga i „Sačuvaj" dugme i završetak tutorijala).
  async function saveProfile(): Promise<boolean> {
    if (!user) return false;

    setAttempted(true);
    if (Object.keys(getFieldErrors()).length > 0) return false;

    setError(null);
    setSuccess(null);
    setSaving(true);

    const matchedCity = city.trim() ? cities.find((c) => normalizeForSearch(c.name) === normalizeForSearch(city)) : undefined;
    const cityToSave = matchedCity ? matchedCity.name : null;

    let avatarUrl = profile?.avatar_url ?? null;

    if (avatarFile) {
      const compressed = await compressImage(avatarFile, CREST_MAX_DIMENSION);
      const ext = compressed.name.split('.').pop() || 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, compressed, { upsert: true });
      if (uploadError) {
        setSaving(false);
        setError(`Otpremanje slike nije uspelo: ${uploadError.message}`);
        return false;
      }
      const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(path);
      avatarUrl = `${publicUrl.publicUrl}?t=${Date.now()}`;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        username: username || null,
        birth_date: birthDate || null,
        phone,
        city: cityToSave,
        avatar_url: avatarUrl,
        ...(avatarFile ? { avatar_position_x: 50, avatar_position_y: 50 } : {}),
        email,
        dominant_hand: dominantHand || null,
        dominant_leg: dominantLeg || null,
        height_cm: heightCm ? Number(heightCm) : null,
        weight_kg: weightKg ? Number(weightKg) : null,
        preferred_positions: positions,
      })
      .eq('id', user.id);

    if (updateError) {
      setSaving(false);
      setError(
        updateError.code === '23505'
          ? 'Ovo korisničko ime je u međuvremenu zauzeto.'
          : updateError.code === '23514'
            ? 'Uneta vrednost nije u dozvoljenom opsegu. Proveri visinu i težinu pa pokušaj ponovo.'
            : 'Čuvanje podataka nije uspelo. Pokušaj ponovo.'
      );
      return false;
    }

    await supabase.from('profile_preferred_sports').delete().eq('profile_id', user.id);
    if (selectedSportIds.length) {
      const { error: sportsError } = await supabase
        .from('profile_preferred_sports')
        .insert(selectedSportIds.map((sportId) => ({ profile_id: user.id, sport_id: sportId })));
      if (sportsError) {
        setSaving(false);
        setError(`Čuvanje sportova nije uspelo: ${sportsError.message}`);
        return false;
      }
    }

    if (email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email });
      if (emailError) {
        setSaving(false);
        setError(`Email nije promenjen: ${emailError.message}`);
        return false;
      }
    }

    await refreshProfile();
    setAvatarFile(null);
    setCity(cityToSave ?? '');
    setSaved({ fullName, username, birthDate, phone, city: cityToSave ?? '', email, dominantHand, dominantLeg, heightCm, weightKg, positions, sportIds: selectedSportIds });
    setSaving(false);
    setSuccess('Promene su sačuvane.');
    return true;
  }

  const displayName = fullName || user?.email || '';
  const selectedSportNames = sports.filter((s) => selectedSportIds.includes(s.id)).map((s) => s.name);
  const showFootballPositions = selectedSportNames.some((n) => FOOTBALL_SPORT_NAMES.includes(n));
  const showBasketballPositions = selectedSportNames.some((n) => BASKETBALL_SPORT_NAMES.includes(n));

  let nextFieldN = 10;
  const footballPositionsN = showFootballPositions ? String(nextFieldN++) : undefined;
  const dominantLegN = showFootballPositions ? String(nextFieldN++) : undefined;
  const basketballPositionsN = showBasketballPositions ? String(nextFieldN++) : undefined;
  const dominantHandN = showBasketballPositions ? String(nextFieldN++) : undefined;

  // Koraci tutorijala. Osnovni koraci su fiksni, a kad korisnik izabere fudbal
  // ili košarku (ili varijante/oba), dodaju se po 2 koraka za taj sport
  // (pozicije + jača noga/ruka) — tačno onim redom kojim se polja pojavljuju.
  const tutorialSteps = useMemo<TutorialStep[]>(() => {
    const steps: TutorialStep[] = [
      {
        ref: avatarRef,
        title: 'Postavi profilnu sliku',
        body: 'Klikni ovde da dodaš svoju sliku. Tako će te saigrači i organizatori lakše prepoznati.',
      },
      {
        ref: cityRef,
        title: 'Iz kog si grada?',
        body: 'Izaberi svoj grad iz liste da bismo ti prikazali turnire i ekipe u blizini.',
      },
      {
        ref: sportsRef,
        title: 'Koje sportove voliš?',
        body: 'Označi sportove koje igraš: fudbal, košarka i drugi. Možeš izabrati više njih, a za svaki sport dobijaš i dodatna pitanja.',
      },
      {
        ref: heightRef,
        title: 'Tvoja visina',
        body: 'Unesi visinu u centimetrima.',
      },
      {
        ref: weightRef,
        title: 'Tvoja težina',
        body: 'Unesi težinu u kilogramima.',
      },
    ];

    if (showFootballPositions) {
      steps.push({
        ref: footballPositionsRef,
        title: 'Pozicije u fudbalu',
        body: 'Izaberi pozicije na kojima najviše igraš u fudbalu. Možeš označiti više njih.',
      });
      steps.push({
        ref: dominantLegRef,
        title: 'Jača noga',
        body: 'Izaberi kojom nogom si jači: levom, desnom ili obema.',
      });
    }

    if (showBasketballPositions) {
      steps.push({
        ref: basketballPositionsRef,
        title: 'Pozicije u košarci',
        body: 'Izaberi pozicije na kojima najviše igraš u košarci. Možeš označiti više njih.',
      });
      steps.push({
        ref: dominantHandRef,
        title: 'Jača ruka',
        body: 'Izaberi kojom rukom si jači: levom, desnom ili obema.',
      });
    }

    return steps;
  }, [showFootballPositions, showBasketballPositions]);

  useEffect(() => {
    if (!showFootballPositions) {
      setPositions((prev) => prev.filter((p) => !FOOTBALL_POSITION_VALUES.includes(p)));
      setDominantLeg('');
    }
  }, [showFootballPositions]);

  useEffect(() => {
    if (!showBasketballPositions) {
      setPositions((prev) => prev.filter((p) => !BASKETBALL_POSITION_VALUES.includes(p)));
      setDominantHand('');
    }
  }, [showBasketballPositions]);

  return (
    <div className="min-h-screen flex flex-col bg-ink-950 text-paper-100 overflow-x-hidden">
      <Seo title="Tvoj profil" description="Podešavanja profila na DerbyManiji." path="/profile" noindex />
      <div className="grain" />
      <SiteHeader />

      <main className="flex-1 pt-16 flex flex-col">
        <section className="flex-1 relative overflow-hidden bg-ink-900 border-b border-ink-700">
          <div
            className="absolute inset-x-0 top-10 h-64 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, var(--paper-100) 0, var(--paper-100) 1px, transparent 1px, transparent 28px)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)',
              maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)',
            }}
          />

          <div className="relative max-w-2xl mx-auto px-6 py-16 sm:py-20">
            <div className="flex flex-col items-center text-center mb-12">
              <button
                ref={avatarRef}
                type="button"
                onClick={openAvatarPicker}
                className="relative w-28 h-28 sm:w-32 sm:h-32 group"
              >
                <UserAvatar
                  name={displayName}
                  avatarUrl={avatarPreview ?? profile?.avatar_url}
                  position={
                    avatarPreview
                      ? { x: 50, y: 50 }
                      : profile
                        ? { x: profile.avatar_position_x, y: profile.avatar_position_y }
                        : undefined
                  }
                  className="w-full h-full text-3xl ring-4 ring-ink-950"
                />
                <span className="absolute inset-0 rounded-full bg-ink-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-paper-100">
                  <CameraIcon className="w-6 h-6" />
                  <span className="text-[10px] uppercase tracking-widest">
                    {(avatarPreview ?? profile?.avatar_url) ? 'Promeni' : 'Dodaj'}
                  </span>
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="sr-only"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="user"
                onChange={handleAvatarChange}
                className="sr-only"
              />
              <p className="text-xs text-paper-500 mt-3">
                {(avatarPreview ?? profile?.avatar_url)
                  ? 'Klikni na sliku da je promeniš.'
                  : 'Klikni da dodaš svoju sliku (maksimalno 5MB).'}
              </p>

              <h1 className="font-display text-3xl sm:text-4xl mt-6 mb-1 leading-tight">Tvoj profil</h1>
              {profile?.username && <p className="text-red-400 text-base font-semibold mt-2">@{profile.username}</p>}
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-7">
              <TicketField n="1" label="Ime i prezime" id="fullName" type="text" autoComplete="name" value={fullName} onChange={setFullName} error={fieldErrors.fullName} />
              <UsernameField
                n="2"
                label="Korisničko ime"
                id="username"
                value={username}
                onChange={setUsername}
                currentUsername={saved?.username}
                onStatusChange={setUsernameStatus}
                error={fieldErrors.username}
                disabled
              />
              <TicketField n="3" label="Datum rođenja" id="birthDate" type="date" autoComplete="bday" value={birthDate} onChange={setBirthDate} disabled />
              <TicketField n="4" label="Broj telefona" id="phone" type="tel" autoComplete="tel" value={phone} onChange={setPhone} disabled />
              <div ref={cityRef}>
                <ComboboxField
                  n="5"
                  label="Mesto/grad"
                  id="city"
                  value={city}
                  onChange={setCity}
                  options={cities}
                  error={fieldErrors.city}
                />
              </div>
              <TicketField n="6" label="Email" id="email" type="email" autoComplete="email" required value={email} onChange={setEmail} disabled />

              <div ref={sportsRef}>
                <MultiSelectPills
                  n="7"
                  label="Preferirani sportovi"
                  value={selectedSportIds.map(String)}
                  onChange={(vals) => setSelectedSportIds(vals.map(Number))}
                  options={sports.map((s) => ({ value: String(s.id), label: s.name }))}
                />
              </div>

              <div ref={heightRef}>
                <TicketField n="8" label="Visina (cm)" id="heightCm" type="number" value={heightCm} onChange={setHeightCm} error={fieldErrors.heightCm} />
              </div>
              <div ref={weightRef}>
                <TicketField n="9" label="Težina (kg)" id="weightKg" type="number" value={weightKg} onChange={setWeightKg} error={fieldErrors.weightKg} />
              </div>

              {showFootballPositions && footballPositionsN && dominantLegN && (
                <>
                  <div ref={footballPositionsRef}>
                    <MultiSelectPills
                      n={footballPositionsN}
                      label="Preferirane pozicije (Fudbal)"
                      value={positions.filter((p) => FOOTBALL_POSITION_VALUES.includes(p))}
                      onChange={(vals) =>
                        setPositions((prev) => [...prev.filter((p) => !FOOTBALL_POSITION_VALUES.includes(p)), ...vals])
                      }
                      options={FOOTBALL_POSITION_OPTIONS}
                    />
                  </div>
                  <div ref={dominantLegRef}>
                    <SelectField
                      n={dominantLegN}
                      label="Dominantna noga"
                      id="dominantLeg"
                      placeholder="Izaberi"
                      value={dominantLeg}
                      onChange={setDominantLeg}
                      options={DOMINANT_OPTIONS}
                    />
                  </div>
                </>
              )}

              {showBasketballPositions && basketballPositionsN && dominantHandN && (
                <>
                  <div ref={basketballPositionsRef}>
                    <MultiSelectPills
                      n={basketballPositionsN}
                      label="Preferirane pozicije (Košarka)"
                      value={positions.filter((p) => BASKETBALL_POSITION_VALUES.includes(p))}
                      onChange={(vals) =>
                        setPositions((prev) => [...prev.filter((p) => !BASKETBALL_POSITION_VALUES.includes(p)), ...vals])
                      }
                      options={BASKETBALL_POSITION_OPTIONS}
                    />
                  </div>
                  <div ref={dominantHandRef}>
                    <SelectField
                      n={dominantHandN}
                      label="Dominantna ruka"
                      id="dominantHand"
                      placeholder="Izaberi"
                      value={dominantHand}
                      onChange={setDominantHand}
                      options={DOMINANT_OPTIONS}
                    />
                  </div>
                </>
              )}

              {error && (
                <p ref={errorRef} className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 text-center">{error}</p>
              )}
              {success && (
                <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/30 px-3 py-2 text-center">{success}</p>
              )}

              <button
                type="submit"
                disabled={
                  saving ||
                  !hasChanges ||
                  (!!username && (usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'checking'))
                }
                className="ticket-submit w-full mt-2 py-4 font-display text-sm tracking-widest uppercase flex items-center justify-center gap-3"
              >
                {saving ? 'Čuvanje…' : 'Sačuvaj promene'}
              </button>
            </form>
          </div>
        </section>

        <section className="bg-ink-950 border-t border-ink-700">
          <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
              <div>
                <h2 className="font-display text-3xl sm:text-4xl mt-4 leading-tight">Moji timovi</h2>
              </div>
              <Link
                to="/timovi/novi"
                className="btn-solid px-6 py-3 text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                Napravi novi tim
              </Link>
            </div>

            {loadingTeams ? (
              <RowSkeletonGrid count={3} />
            ) : myTeams.length === 0 ? (
              <p className="text-paper-500">Nisi još napravio nijedan tim.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {myTeams.map((team, index) => (
                  <TeamRow key={team.id} team={team} index={index} />
                ))}
              </div>
            )}

            <h2 className="font-display text-3xl sm:text-4xl mt-16 mb-10 leading-tight">Timovi u kojima si član</h2>

            {loadingMemberTeams ? (
              <RowSkeletonGrid count={3} />
            ) : memberTeams.length === 0 ? (
              <p className="text-paper-500">Nisi još član nijednog drugog tima.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {memberTeams.map((team, index) => (
                  <TeamRow key={team.id} team={team} index={index} />
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mt-16 mb-10">
              <div>
                <h2 className="font-display text-3xl sm:text-4xl leading-tight">Turniri koje si kreirao</h2>
              </div>
              <Link
                to="/turniri/novi"
                className="btn-solid px-6 py-3 text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                Napravi novi turnir
              </Link>
            </div>

            {loadingTournaments ? (
              <RowSkeletonGrid count={3} />
            ) : myTournaments.length === 0 ? (
              <p className="text-paper-500">Nisi još napravio nijedan turnir.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {myTournaments.map((tournament, index) => (
                  <TournamentRow key={tournament.id} tournament={tournament} index={index} />
                ))}
              </div>
            )}

            <h2 className="font-display text-3xl sm:text-4xl mt-16 mb-10 leading-tight">Turniri na kojima si učestvovao</h2>

            {loadingParticipatedTournaments ? (
              <RowSkeletonGrid count={3} />
            ) : participatedTournaments.length === 0 ? (
              <p className="text-paper-500">Nisi još učestvovao ni na jednom turniru.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {participatedTournaments.map((tournament, index) => (
                  <TournamentRow key={tournament.id} tournament={tournament} index={index} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {avatarMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Zatvori"
            onClick={() => setAvatarMenuOpen(false)}
            className="absolute inset-0 bg-ink-950/70"
          />
          <div className="relative z-10 w-full sm:max-w-sm bg-ink-900 border-t sm:border border-red-500/30 sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] sm:mx-6 mb-0 sm:mb-0 rise-1">
            <div className="px-6 py-4 border-b border-ink-700 text-center">
              <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Profilna slika</span>
            </div>
            <div className="divide-y divide-ink-800">
              <button
                type="button"
                onClick={() => {
                  setAvatarMenuOpen(false);
                  cameraInputRef.current?.click();
                }}
                className="w-full flex items-center gap-3 px-6 py-4 text-left text-sm text-paper-100 hover:bg-red-500/10 transition-colors"
              >
                <CameraIcon className="w-5 h-5 text-red-400 shrink-0" />
                Uslikaj se
              </button>
              <button
                type="button"
                onClick={() => {
                  setAvatarMenuOpen(false);
                  fileInputRef.current?.click();
                }}
                className="w-full flex items-center gap-3 px-6 py-4 text-left text-sm text-paper-100 hover:bg-red-500/10 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-red-400 shrink-0">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.5-3.5a2 2 0 0 0-2.8 0L4 22" />
                </svg>
                Izaberi iz galerije
              </button>
            </div>
            <button
              type="button"
              onClick={() => setAvatarMenuOpen(false)}
              className="w-full px-6 py-4 text-sm uppercase tracking-widest text-paper-500 hover:text-paper-100 border-t border-ink-700 transition-colors"
            >
              Otkaži
            </button>
          </div>
        </div>
      )}

      {cropSrc && (
        <ImageCropper src={cropSrc} fileName={cropFileName} title="Podesi profilnu sliku" onCancel={handleCropCancel} onConfirm={handleCropConfirm} />
      )}

      {showTutorial && <ProfileTutorial steps={tutorialSteps} onClose={closeTutorial} onFinish={finishTutorial} />}

      <SiteFooter />
    </div>
  );
}
