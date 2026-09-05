import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ClerkProvider, SignedIn, SignedOut, SignIn } from '@clerk/clerk-react';
import { AuthInit } from '@/components/auth-init';

import NotFound from '@/pages/not-found';
import Overview from '@/pages/overview';
import Chat from '@/pages/chat';
import EpisodesEvents from '@/pages/episodes-events';
import WorkspaceEditor from '@/pages/workspace-editor';
import Terminal from '@/pages/terminal';
import EcsStatusPage from '@/pages/ecs-status';
import Shell from '@/components/shell';

import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

// Access Vite env var
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Overview} />
        <Route path="/chat" component={Chat} />
        <Route path="/episodes" component={EpisodesEvents} />
        <Route path="/workspace" component={WorkspaceEditor} />
        <Route path="/terminal" component={Terminal} />
        <Route path="/ecs" component={EcsStatusPage} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  if (!clerkPubKey) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-destructive p-4">
        Missing VITE_CLERK_PUBLISHABLE_KEY environment variable.
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <AuthInit />
        <TooltipProvider>
          <SignedOut>
            <div className="flex h-screen items-center justify-center bg-background">
              <SignIn routing="hash" />
            </div>
          </SignedOut>
          <SignedIn>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Shell>
                <Router />
              </Shell>
            </WouterRouter>
          </SignedIn>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
