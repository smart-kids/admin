import React from "react";
import { Route, HashRouter, useHistory, Redirect } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";

import home from "./pages/home";
import students from "./pages/students";
import student from "./pages/student";
import parents from "./pages/parents";
import classes from "./pages/classes";
import teachers from "./pages/teachers";
import teams from "./pages/teams";
import drivers from "./pages/drivers";
import buses from "./pages/buses"
import routes from "./pages/routes"
import schedules from "./pages/schedules"
import complaints from "./pages/complaints"
import trips from "./pages/trips"
import trip from "./pages/trip"
import learning from "./pages/learning"
import invitations from "./pages/invitations"
import members from "./pages/members"
import schools from "./pages/schools"
import library from "./pages/library"
import games from "./pages/games"
import mdm from "./pages/mdm"
import timeTables from "./pages/time-tables"

import userSettings from "./pages/settings/user"
import schoolSettings from "./pages/settings/school"

import communications from "./pages/communications"

import login from "./pages/auth/login-new";
import website from "./pages/website";

import recover from "./pages/auth/recover";
import register from "./pages/auth/register";

import topup from "./pages/finance/topup"
import charges from "./pages/finance/charges"
import chargeTypes from "./pages/finance/chargeTypes"
import institutionalDeposits from "./pages/finance/institutional-deposits"
import admins from "./pages/admins";
import feeStructures from "./pages/fee-structures";

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
      {/* overal stuff */}
      <Route exact path="/" component={login} />
      <Route exact path="/register" component={register} />
      <Route exact path="/recover" component={recover} />
      <Route exact path="/quick-topup" component={require("./pages/public/QuickTopUp").default} />
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
      <PrivateRoute path="/finance/fees" component={require("./pages/finance/fees").default} />
      <PrivateRoute path="/results" component={require("./pages/results").default} />
      <PrivateRoute path="/teams" component={teams} />
      <PrivateRoute path="/invitations" component={invitations} />
      <PrivateRoute path="/members" component={members} />

      <PrivateRoute path="/schools" component={schools} />
      <PrivateRoute path="/library" component={library} />
      <PrivateRoute path="/games" component={games} />
      <PrivateRoute path="/mdm" component={mdm} />
      <PrivateRoute path="/time-tables" component={timeTables} />
      <PrivateRoute path="/fee-structures" component={feeStructures} />
      <PrivateRoute path="/terms" component={require("./pages/terms").default} />
      <PrivateRoute path="/assessment-types" component={require("./pages/learning/assessmentTypes").default} />
      <PrivateRoute path="/rubrics" component={require("./pages/learning/rubrics").default} />
     

      {/* super admin routes */}



      {/* teacher routes */}



      {/* 3rd party admin routes */}
        </HashRouter>
      </ThemeProvider>
    )

  }
}

export default App;
