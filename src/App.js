import React, { Suspense } from "react";
import { Route, HashRouter, useHistory, Redirect } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import UpdateChecker from "./components/UpdateChecker";
import Footer from "./components/footer";
import PageLoader from "./components/PageLoader/PageLoader";

const home = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/home"));
const students = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/students"));
const student = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/student"));
const parents = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/parents"));
const classes = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/classes"));
const teachers = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/teachers"));
const teams = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/teams"));
const drivers = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/drivers"));
const buses = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/buses"));
const routes = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/routes"));
const schedules = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/schedules"));
const complaints = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/complaints"));
const trips = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/trips"));
const trip = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/trip"));
const learning = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/learning"));
const invitations = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/invitations"));
const members = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/members"));
const schools = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/schools"));
const library = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/library"));
const games = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/games"));
const mdm = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/mdm"));
const timeTables = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/time-tables"));
const activityLog = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/activity-log"));

const userSettings = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/settings/user"));
const schoolSettings = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/settings/school"));

const communications = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/communications"));

const login = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/auth/login-new"));
const website = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/website"));

const recover = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/auth/recover"));
const register = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/auth/register"));

const topup = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/finance/topup"));
const charges = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/finance/charges"));
const chargeTypes = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/finance/chargeTypes"));
const institutionalDeposits = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/finance/institutional-deposits"));
const budgets = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/finance/budgets"));
const expenses = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/finance/expenses"));
const budgetsDashboard = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/finance/budgets/dashboard"));
const expensesDashboard = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/finance/expenses/dashboard"));
const admins = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/admins"));
const feeStructures = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/fee-structures"));

// Lazy load inline requires
const QuickTopUp = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/public/QuickTopUp"));
const Fees = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/finance/fees"));
const Results = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/results"));
const Terms = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/terms"));
const AssessmentTypes = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/learning/assessmentTypes"));
const Rubrics = React.lazy(() => import(/* webpackPrefetch: true */ "./pages/learning/rubrics"));

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
