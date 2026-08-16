import React, { Suspense } from "react";
import { Route, HashRouter, useHistory, Redirect } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import UpdateChecker from "./components/UpdateChecker";
import Footer from "./components/footer";
import PageLoader from "./components/PageLoader/PageLoader";


/**
 * A wrapper around React.lazy that forces the browser to reload the page
 * if a ChunkLoadError occurs (usually meaning a new version was deployed).
 */
export const lazyWithRetry = (componentImport) =>
  React.lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        // Assume the error is a ChunkLoadError. 
        // Set flag to true so we don't end up in an infinite reload loop if the server is actually down.
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        
        // Refresh the page to get the latest index.html and chunk hashes
        window.location.reload();
        return;
      }
      
      // If we already refreshed and it STILL failed, throw the actual error (maybe network is down)
      throw error;
    }
  });

const home = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/home"));
const students = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/students"));
const student = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/student"));
const parents = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/parents"));
const classes = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/classes"));
const teachers = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/teachers"));
const teams = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/teams"));
const drivers = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/drivers"));
const buses = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/buses"));
const routes = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/routes"));
const schedules = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/schedules"));
const complaints = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/complaints"));
const trips = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/trips"));
const trip = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/trip"));
const learning = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/learning"));
const invitations = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/invitations"));
const members = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/members"));
const schools = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/schools"));
const library = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/library"));
const games = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/games"));
const mdm = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/mdm"));
const timeTables = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/time-tables"));
const activityLog = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/activity-log"));

const userSettings = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/settings/user"));
const schoolSettings = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/settings/school"));

const communications = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/communications"));

const login = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/auth/login-new"));
const website = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/website"));

const recover = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/auth/recover"));
const register = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/auth/register"));

const topup = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/finance/topup"));
const charges = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/finance/charges"));
const chargeTypes = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/finance/chargeTypes"));
const institutionalDeposits = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/finance/institutional-deposits"));
const budgets = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/finance/budgets"));
const expenses = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/finance/expenses"));
const budgetsDashboard = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/finance/budgets/dashboard"));
const expensesDashboard = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/finance/expenses/dashboard"));
const admins = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/admins"));
const feeStructures = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/fee-structures"));

// Lazy load inline requires
const QuickTopUp = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/public/QuickTopUp"));
const Fees = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/finance/fees"));
const Results = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/results"));
const Terms = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/terms"));
const AssessmentTypes = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/learning/assessmentTypes"));
const Rubrics = lazyWithRetry(() => import(/* webpackPrefetch: true */ "./pages/learning/rubrics"));

const PrivateRoute = ({ component: Component, ...rest }) => (
  <Route {...rest} render={(props) => (
    localStorage.getItem('authorization')
      ? <Component {...props} />
      : <Redirect to='/' />
  )} />
)

class App extends React.Component {
  render() {

    return (
      <ThemeProvider>
        <HashRouter>
          <Suspense fallback={<PageLoader />}>
          <PWAInstallPrompt />
          <UpdateChecker />
      {/* overal stuff */}
      <Route exact path="/" component={login} />
      <Route exact path="/register" component={register} />
      <Route exact path="/recover" component={recover} />
      <Route exact path="/quick-topup" component={QuickTopUp} />
      <Route exact path="/auth" component={login} />

      {/* main admin stuff */}
      <PrivateRoute exact path="/home" component={home} />
      <PrivateRoute path="/students" component={students} />
      <PrivateRoute path="/student/:id" component={student} />
      <PrivateRoute path="/schedules" component={schedules} />
      <PrivateRoute path="/parents" component={parents} />
      <PrivateRoute path="/drivers" component={drivers} />
      <PrivateRoute path="/admins" component={admins} />
      <PrivateRoute path="/buses" component={buses} />
      <PrivateRoute path="/routes" component={routes} />
      <PrivateRoute path="/messages" component={complaints} />
      <PrivateRoute path="/classes" component={classes} />
      <PrivateRoute path="/teachers" component={teachers} />
      <PrivateRoute path="/comms" component={communications} />
      <PrivateRoute path="/reports/bus/:id" component={students} />
      <PrivateRoute path="/trips/:filter" component={trips} />
      <PrivateRoute path="/trip/:id" component={trip} />
      <PrivateRoute path="/learning" component={learning} />
      <PrivateRoute path="/settings/user" component={userSettings} />
      <PrivateRoute path="/settings/school" component={schoolSettings} />
      <PrivateRoute path="/finance/topup" component={topup} />
      <PrivateRoute path="/finance/charges" component={charges} />
      <PrivateRoute path="/finance/charge-types" component={chargeTypes} />
      <PrivateRoute path="/finance/institutional-deposits" component={institutionalDeposits} />
      <PrivateRoute path="/finance/budgets" component={budgets} exact />
      <PrivateRoute path="/finance/expenses" component={expenses} exact />
      <PrivateRoute path="/finance/budgets/dashboard" component={budgetsDashboard} />
      <PrivateRoute path="/finance/expenses/dashboard" component={expensesDashboard} />
      <PrivateRoute path="/finance/fees" component={Fees} />
      <PrivateRoute path="/results" component={Results} />
      <PrivateRoute path="/teams" component={teams} />
      <PrivateRoute path="/invitations" component={invitations} />
      <PrivateRoute path="/members" component={members} />

      <PrivateRoute path="/schools" component={schools} />
      <PrivateRoute path="/library" component={library} />
      <PrivateRoute path="/games" component={games} />
      <PrivateRoute path="/mdm" component={mdm} />
      <PrivateRoute path="/time-tables" component={timeTables} />
      <PrivateRoute path="/activity-log" component={activityLog} />
      <PrivateRoute path="/fee-structures" component={feeStructures} />
      <PrivateRoute path="/terms" component={Terms} />
      <PrivateRoute path="/assessment-types" component={AssessmentTypes} />
      <PrivateRoute path="/rubrics" component={Rubrics} />
     

      {/* super admin routes */}



      {/* teacher routes */}



      {/* 3rd party admin routes */}
          <Footer />
          </Suspense>
        </HashRouter>
      </ThemeProvider>
    )

  }
}

export default App;
