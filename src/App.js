import React, { Suspense } from "react";
import { Route, HashRouter, useHistory, Redirect } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import UpdateChecker from "./components/UpdateChecker";
import Footer from "./components/footer";
import PageLoader from "./components/PageLoader/PageLoader";

const home = React.lazy(() => import("./pages/home"));
const students = React.lazy(() => import("./pages/students"));
const student = React.lazy(() => import("./pages/student"));
const parents = React.lazy(() => import("./pages/parents"));
const classes = React.lazy(() => import("./pages/classes"));
const teachers = React.lazy(() => import("./pages/teachers"));
const teams = React.lazy(() => import("./pages/teams"));
const drivers = React.lazy(() => import("./pages/drivers"));
const buses = React.lazy(() => import("./pages/buses"));
const routes = React.lazy(() => import("./pages/routes"));
const schedules = React.lazy(() => import("./pages/schedules"));
const complaints = React.lazy(() => import("./pages/complaints"));
const trips = React.lazy(() => import("./pages/trips"));
const trip = React.lazy(() => import("./pages/trip"));
const learning = React.lazy(() => import("./pages/learning"));
const invitations = React.lazy(() => import("./pages/invitations"));
const members = React.lazy(() => import("./pages/members"));
const schools = React.lazy(() => import("./pages/schools"));
const library = React.lazy(() => import("./pages/library"));
const games = React.lazy(() => import("./pages/games"));
const mdm = React.lazy(() => import("./pages/mdm"));
const timeTables = React.lazy(() => import("./pages/time-tables"));
const activityLog = React.lazy(() => import("./pages/activity-log"));

const userSettings = React.lazy(() => import("./pages/settings/user"));
const schoolSettings = React.lazy(() => import("./pages/settings/school"));

const communications = React.lazy(() => import("./pages/communications"));

const login = React.lazy(() => import("./pages/auth/login-new"));
const website = React.lazy(() => import("./pages/website"));

const recover = React.lazy(() => import("./pages/auth/recover"));
const register = React.lazy(() => import("./pages/auth/register"));

const topup = React.lazy(() => import("./pages/finance/topup"));
const charges = React.lazy(() => import("./pages/finance/charges"));
const chargeTypes = React.lazy(() => import("./pages/finance/chargeTypes"));
const institutionalDeposits = React.lazy(() => import("./pages/finance/institutional-deposits"));
const budgets = React.lazy(() => import("./pages/finance/budgets"));
const expenses = React.lazy(() => import("./pages/finance/expenses"));
const budgetsDashboard = React.lazy(() => import("./pages/finance/budgets/dashboard"));
const expensesDashboard = React.lazy(() => import("./pages/finance/expenses/dashboard"));
const admins = React.lazy(() => import("./pages/admins"));
const feeStructures = React.lazy(() => import("./pages/fee-structures"));

// Lazy load inline requires
const QuickTopUp = React.lazy(() => import("./pages/public/QuickTopUp"));
const Fees = React.lazy(() => import("./pages/finance/fees"));
const Results = React.lazy(() => import("./pages/results"));
const Terms = React.lazy(() => import("./pages/terms"));
const AssessmentTypes = React.lazy(() => import("./pages/learning/assessmentTypes"));
const Rubrics = React.lazy(() => import("./pages/learning/rubrics"));

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
