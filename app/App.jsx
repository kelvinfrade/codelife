import React, {Component} from "react";
import {connect} from "react-redux";
import {Canon, isAuthenticated} from "datawheel-canon";
import PropTypes from "prop-types";
import Helmet from "react-helmet";

import header from "./helmet.js";

import "./App.css";
import "./Islands.css";

import Clouds from "components/Clouds";
import Footer from "components/Footer";
import Nav from "components/Nav";
import LoadingSpinner from "components/LoadingSpinner";

import axios from "axios";

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {userInit: false};
  }

  componentWillMount() {
    this.props.isAuthenticated();
  }

  getChildContext() {
    return {browserHistory: this.props.router};
  }

  redirect(userprofile) {
    const {location} = this.props;
    const {hostname} = location;
    // If the user navigates to codelife.com, redirect them to pt, unless their profile says otherwise
    if (!hostname.includes("en.") && !hostname.includes("pt.")) {
      if (userprofile) {
        if (userprofile.lang === "en") {
          if (window) window.location = `${location.protocol}//en.${location.host}${location.pathname}${location.search}`;
        }
        else {
          if (window) window.location = `${location.protocol}//pt.${location.host}${location.pathname}${location.search}`;
        }
      }
      else {
        if (window) window.location = `${location.protocol}//pt.${location.host}${location.pathname}${location.search}`;
      }
    }
  }

  componentDidUpdate(prevProps) {
    const {auth} = this.props;
    const {userInit} = this.state;
    if (!userInit && auth.loading) this.setState({userInit: true});
    if (!prevProps.auth.user && this.props.auth.user) {
      axios.get("/api/profileping").then(resp => {
        // On Mounting the app, we need to create a blank user in userprofiles that associates
        // with the user in canon's users.  This calls findOrCreate to make that happen.
        this.redirect.bind(this)(resp.data[0]);
      });
    }
  }

  componentDidMount() {
    //this.redirect.bind(this)();

    const iget = axios.get("/api/islands/all");
    const lget = axios.get("/api/levels/all");
    const gget = axios.get("/api/glossary/all");

    Promise.all([iget, lget, gget]).then(resp => {
      const islands = resp[0].data;
      const levels = resp[1].data;
      const glossary = resp[2].data;
      this.props.dispatch({type: "LOAD_ISLANDS", payload: islands});
      this.props.dispatch({type: "LOAD_LEVELS", payload: levels});
      this.props.dispatch({type: "LOAD_GLOSSARY", payload: glossary});
    });
  }

  render() {
    const {auth, children, i18n, location, islands} = this.props;
    const {userInit} = this.state;

    const path = this.props.router.location.pathname.slice(-1) === "/" ? this.props.router.location.pathname.slice(0, -1) : this.props.router.location.pathname;
    const routes = path.split("/");

    const authRoute = routes[0] === "login";
    const bareRoute = ["projects", "codeBlocks"].includes(routes[0]) && routes.length === 3;

    const seoPath = this.props.router.location.pathname;
    const seoRoute = seoPath.includes("lessonplan") || seoPath.includes("glossary");

    const meta = header.meta.slice();

    if (i18n.locale === "en" || i18n.locale === "en-US") {
      meta.find(d => d.property === "og:image").content = "https://codelife.com/social/codelife-share-en.jpg";
      meta.find(d => d.property === "og:description").content = "Code School Brazil is a free online resource for high school students in Brazil to learn skills relevant to work in Brazil’s IT sector.";
      meta.find(d => d.name === "description").content = "Code School Brazil is a free online resource for high school students in Brazil to learn skills relevant to work in Brazil’s IT sector.";
    }
    meta.push({property: "og:locale", content: i18n.locale});

    let theme = "";
    const lookup = routes[0] === "island" && routes.length > 1 ? routes[1] : false;
    const currentIsland = islands.find(island => island.id === lookup);
    if (currentIsland) theme = currentIsland.theme;

    const reduxLoaded = Boolean(this.props.islands.length && this.props.levels.length && this.props.glossary.length);

    // check if this is the home page
    const isHome = this.props.router.location.pathname == "/" ? true : false;
    const isAdmin = this.props.router.location.pathname.includes("admin") ? true : false;

    return (
      <Canon id="app" className={bareRoute && "share-app"}>
        <Helmet link={ header.link } meta={ meta } />
        {
          !bareRoute && (location.href.includes("dev.") || location.href.includes("nightly."))
            ? <div className="devbar">Development Server. Do not edit content here!</div>
            : null
        }
        { reduxLoaded && userInit && !auth.loading || authRoute || bareRoute || seoRoute
          ? bareRoute
            ? children
            : <div className="container">
              { !isHome && !isAdmin ? <Clouds /> : null }
              <Nav currentPath={location.pathname} linkObj={this.props.params} isHome={ isHome } />
              { children }
              <Footer currentPath={location.pathname} className={ theme } />
            </div>
          : <div className="container">
            { !isHome && !isAdmin ? <Clouds /> : null }
            <LoadingSpinner />
          </div> }
      </Canon>
    );

  }
}

App.childContextTypes = {
  browserHistory: PropTypes.object
};

const mapStateToProps = state => ({
  auth: state.auth,
  i18n: state.i18n,
  location: state.location,
  islands: state.islands,
  levels: state.levels,
  glossary: state.glossary
});

const mapDispatchToProps = dispatch => ({
  dispatch: action => dispatch(action),
  isAuthenticated: () => {
    dispatch(isAuthenticated());
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
