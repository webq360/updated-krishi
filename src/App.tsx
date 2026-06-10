import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Providers & Components
import { NotificationProvider } from './components/NotificationManager';
import { WeatherProvider } from './components/WeatherContext';
import { ThemeProvider } from './components/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import { LoadingScreen, PageLoader } from './components/Loaders';
import { ProtectedRoute, AdminRoute } from './components/AuthRoutes';
import { Layout } from './components/Layout';

// Pages - Lazy Loaded
const HomePage = React.lazy(() => import('./pages/Home'));
const SpeciesList = React.lazy(() => import('./pages/SpeciesList'));
const SpeciesDetail = React.lazy(() => import('./pages/SpeciesDetail'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const FarmJournal = React.lazy(() => import('./pages/FarmJournal'));
const WeatherAlerts = React.lazy(() => import('./pages/WeatherAlerts'));
const Marketplace = React.lazy(() => import('./pages/Marketplace'));
const Products = React.lazy(() => import('./pages/Products'));
const AdminPanel = React.lazy(() => import('./pages/AdminPanel'));
const ProblemSolver = React.lazy(() => import('./pages/ProblemSolver'));
const MarketPrice = React.lazy(() => import('./pages/MarketPrice'));
const CommunityForum = React.lazy(() => import('./pages/CommunityForum'));
const CropCalendar = React.lazy(() => import('./pages/CropCalendar'));
const MyStories = React.lazy(() => import('./pages/MyStories'));
const KrishiProshikkhon = React.lazy(() => import('./pages/KrishiProshikkhon'));
const PestWarning = React.lazy(() => import('./pages/PestWarning'));
const AIDisease = React.lazy(() => import('./pages/AIDisease'));
const SoilHealth = React.lazy(() => import('./pages/SoilHealth'));
const SmartIrrigation = React.lazy(() => import('./pages/SmartIrrigation'));
const VideoTutorials = React.lazy(() => import('./pages/VideoTutorials'));
const ColdStorage = React.lazy(() => import('./pages/ColdStorage'));
const SeedBank = React.lazy(() => import('./pages/SeedBank'));
const RentMachine = React.lazy(() => import('./pages/RentMachine'));
const GovtSchemes = React.lazy(() => import('./pages/GovtSchemes'));
const Suraksha = React.lazy(() => import('./pages/Suraksha'));
const BondhuRin = React.lazy(() => import('./pages/BondhuRin'));
const ExportApplication = React.lazy(() => import('./pages/ExportApplication'));
const PonaKroy = React.lazy(() => import('./pages/PonaKroy'));
const IrrigationCalc = React.lazy(() => import('./pages/IrrigationCalc'));
const ChatWithExpert = React.lazy(() => import('./pages/ChatWithExpert'));
const CardApplication = React.lazy(() => import('./pages/CardApplication'));
const AboutUs = React.lazy(() => import('./pages/AboutUs'));
const AgentRegistration = React.lazy(() => import('./pages/AgentRegistration'));
const GlobalExportGuide = React.lazy(() => import('./pages/GlobalExportGuide'));
const SatelliteMonitoring = React.lazy(() => import('./pages/SatelliteMonitoring'));
const AgentLogin = React.lazy(() => import('./pages/AgentLogin'));
const AgentDashboard = React.lazy(() => import('./pages/AgentDashboard'));
const FarmingLedger = React.lazy(() => import('./pages/FarmingLedger'));
const ResourceMap = React.lazy(() => import('./pages/ResourceMap'));
const KnowledgeBase = React.lazy(() => import('./pages/KnowledgeBase'));
const LivestockHealth = React.lazy(() => import('./pages/LivestockHealth'));
const FishWaterTest = React.lazy(() => import('./pages/FishWaterTest'));

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <WeatherProvider>
            <NotificationProvider>
              <Layout>
                <React.Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    <Route path="/species/:id" element={<SpeciesDetail />} />
                    <Route path="/livestock" element={<SpeciesList category="livestock" />} />
                    <Route path="/poultry" element={<SpeciesList category="poultry" />} />
                    <Route path="/fisheries" element={<SpeciesList category="fisheries" />} />
                    <Route path="/vegetables" element={<SpeciesList category="vegetables" />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/farmer-market" element={<Marketplace />} />
                    <Route path="/market-price" element={<MarketPrice />} />
                    <Route path="/community-forum" element={<CommunityForum />} />
                    <Route path="/crop-calendar" element={<CropCalendar />} />
                    <Route path="/farm-journal" element={<ProtectedRoute><FarmJournal /></ProtectedRoute>} />
                    <Route path="/weather-alerts" element={<WeatherAlerts />} />
                    <Route path="/problem_solver" element={<ProblemSolver />} />
                    <Route path="/stories" element={<MyStories />} />
                    <Route path="/training" element={<KrishiProshikkhon />} />
                    <Route path="/pest-warning" element={<PestWarning />} />
                    <Route path="/ai-disease" element={<AIDisease />} />
                    <Route path="/soil-health" element={<SoilHealth />} />
                    <Route path="/smart-irrigation" element={<SmartIrrigation />} />
                    <Route path="/tutorials" element={<VideoTutorials />} />
                    <Route path="/cold-storage" element={<ColdStorage />} />
                    <Route path="/seed-bank" element={<SeedBank />} />
                    <Route path="/rent-machine" element={<RentMachine />} />
                    <Route path="/govt-schemes" element={<GovtSchemes />} />
                    <Route path="/suraksha" element={<Suraksha />} />
                    <Route path="/bondhu-rin" element={<BondhuRin />} />
                    <Route path="/card-application" element={<CardApplication />} />
                    <Route path="/export-application" element={<ExportApplication />} />
                    <Route path="/global-standards" element={<GlobalExportGuide />} />
                    <Route path="/satellite-monitoring" element={<SatelliteMonitoring />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/pona-kroy" element={<PonaKroy />} />
                    <Route path="/irrigation-calc" element={<IrrigationCalc />} />
                    <Route path="/chat-expert" element={<ChatWithExpert />} />
                    <Route path="/agent-registration" element={<AgentRegistration />} />
                    <Route path="/agent-login" element={<AgentLogin />} />
                    <Route path="/agent-dashboard" element={<AgentDashboard />} />
                    <Route path="/ledger" element={<FarmingLedger />} />
                    <Route path="/resource-map" element={<ResourceMap />} />
                    <Route path="/knowledge-base" element={<KnowledgeBase />} />
                    <Route path="/livestock-health" element={<LivestockHealth />} />
                    <Route path="/fish-water-test" element={<FishWaterTest />} />

                    <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </React.Suspense>
              </Layout>
            </NotificationProvider>
          </WeatherProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}
