import React, {Component} from "react";
import {translate} from "react-i18next";
import {Link} from "react-router";
import {connect} from "react-redux";
import Browser from "components/Browser";
import Logo from "components/Logo.svg";
import Search from "components/Search";
import AuthForm from "components/AuthForm";
import PropTypes from "prop-types";
import {login, resetPassword} from "datawheel-canon/src/actions/auth";

import {
  RESET_SEND_FAILURE,
  RESET_SEND_SUCCESS,
  WRONG_PW,
  SIGNUP_EXISTS
} from "datawheel-canon/src/consts";

import "./Nav.css";

import {Popover, PopoverInteractionKind, Position, Dialog, Intent, Toaster} from "@blueprintjs/core";


// Nav Component
// Contains a list of links in Footer format, inserted at the bottom of each page

class Nav extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showBrowser: false,
      isLoginOpen: false,
      toast: typeof window !== "undefined" ? Toaster.create() : null
    };
  }

  componentDidMount() {
    const {auth, t} = this.props;
    const {email, toast} = this.state;
    const {browserHistory} = this.context;
    const timeout = 2500;

    if (!auth.loading) {

      if (auth.error) {
        this.setState({isLoginOpen: true});
      }

      if (auth.error === WRONG_PW) {
        toast.show({
          action: {
            onClick: () => {
              this.setState({isLoginOpen: false});
              browserHistory.push("/reset");
            },
            text: t("Reset.button")
          },
          iconName: "error",
          intent: Intent.DANGER,
          message: t("Login.error"),
          timeout
        });
      }
      else if (auth.msg === RESET_SEND_SUCCESS) {
        toast.show({timeout, iconName: "inbox", intent: Intent.SUCCESS, message: t("Reset.actions.RESET_SEND_SUCCESS", {email})});
      }
      else if (auth.error === RESET_SEND_FAILURE) {
        toast.show({timeout, iconName: "error", intent: Intent.DANGER, message: t("Reset.actions.RESET_SEND_FAILURE")});
      }
      else if (auth.error === SIGNUP_EXISTS) {
        this.setState({formMode: "signup"});
        toast.show({timeout, iconName: "blocked-person", intent: Intent.WARNING, message: t("SignUp.error.Exists")});
      }
      else if (!auth.error) {
        if (auth.msg === "LOGIN_SUCCESS") {
          // toast.show({timeout, iconName: "endorsed", intent: Intent.SUCCESS, message: t("Login.success")});
        }
        // TODO: on mount, its not known where we came from (i.e., signup or login) so generic "success" is shown
        // It would be nice to show a different message for a signup
        // this.showToast(t("SignUp.success"), "endorsed", Intent.SUCCESS);
      }
    }
  }

  /*
  This progress reloader is not robust. Ideally, userprogress should be loaded once ever, live in redux state,
  and update each time the user beats a level in parallel with updating the underlying database. However, to
  avoid a refactor, the following code manually reaches into the Browser component and reloads userprogress
  on each open/close of the panel.  TODO: revisit this
  */
  toggleBrowser() {
    this.setState({showBrowser: !this.state.showBrowser});
    if (this.browser) this.browser.getWrappedInstance().getWrappedInstance().reloadProgress();
  }

  reportClick() {
    this.setState({showBrowser: false});
  }

  authForm(mode) {
    this.setState({formMode: mode, isLoginOpen: !this.state.isLoginOpen});
  }

  render() {
    const {auth, currentPath, isHome, linkObj, serverLocation, t} = this.props;
    const {isLoginOpen} = this.state;
    const {protocol, host} = serverLocation;
    const hostSansSub = host.replace("pt.", "").replace("en.", "").replace("www.", "");

    // language select links
    const languageLinks = [
      {id: 1, title: t("English"), shortTitle: "En", link: `${protocol}//en.${hostSansSub}${currentPath}`},
      {id: 2, title: t("Portuguese"), shortTitle: "Pt", link: `${protocol}//pt.${hostSansSub}${currentPath}`}
    ];

    return (
      <div className="nav" id="nav">

        {/* logo */}
        <div className="logo">
          <Link className={isHome ? "logo-link is-active" : "logo-link"} to={"/"}>
            {/* <span className="logo-tag font-xs">Beta</span> */}
            <span className="logo-text">
              <Logo />
            </span>
          </Link>
        </div>

        {/* site-wide search */}
        { auth.user ? <Search linkObj={linkObj} scope="sitewide" /> : null }

        { auth.user
          ? <div className="link-list font-sm">
            <Link className="link with-toggle" to="/island" id="map-nav-link">
              <span className="link-icon pt-icon-standard pt-icon-map" />
              <span className="link-text u-hide-below-sm">{ t("Map") }</span>
            </Link>
            <Popover
              interactionKind={PopoverInteractionKind.CLICK}
              className="link-toggle-container"
              popoverClassName="pt-popover-content-sizing browser-popover"
              position={Position.BOTTOM}
            >
              <button className="link-toggle-button u-unbutton" onClick={this.toggleBrowser.bind(this)} aria-labelledby="map-nav-link">
                <span className="toggle-icon pt-icon-standard pt-icon-chevron-down"></span>
              </button>
              <div className="dropdown-list browser-list" id="browser">
                <Browser ref={b => this.browser = b} linkObj={linkObj} reportClick={this.reportClick.bind(this)}/>
              </div>
            </Popover>

            {/* my projects */}
            <Link className="link projects-link" to={`/projects/${auth.user.username}`}>
              <span className="link-icon pt-icon-standard pt-icon-applications" />
              <span className="link-text u-hide-below-sm">{ t("My projects") }</span>
            </Link>

            {/* account */}
            <Link className="link with-toggle" to={ `/profile/${ auth.user.username }` } id="account-nav-link">
              <span className="link-icon pt-icon-standard pt-icon-user" />
              <span className="link-text u-hide-below-sm">
                <span className="limit-link-text-width">
                  { auth.user.username }
                </span>
              </span>
            </Link>
            {/* dropdown */}
            <Popover
              inline
              interactionKind={PopoverInteractionKind.CLICK}
              className="link-toggle-container"
              popoverClassName="pt-popover-content-sizing account-popover"
              position={Position.BOTTOM}
            >
              {/* dropdown button */}
              <button className="link-toggle-button u-unbutton" aria-labelledby="account-nav-link">
                <span className="toggle-icon pt-icon-standard pt-icon-chevron-down"></span>
              </button>

              {/* dropdown links */}
              <div className="link-dropdown">
                {/* my profile */}
                <Link className="link font-sm pt-popover-dismiss" to={ `/profile/${ auth.user.username }` } autoFocus>
                  <span className="link-icon pt-icon-standard pt-icon-id-number" />
                  { t("My profile") }
                </Link>
                {/* my projects */}
                <Link className="link font-sm pt-popover-dismiss" to={`/projects/${auth.user.username}`}>
                  <span className="link-icon pt-icon-standard pt-icon-applications" />
                  <span className="link-text u-hide-below-sm">{ t("My projects") }</span>
                </Link>
                {/* admin link */}
                { auth.user.role > 0 ? <Link className="link font-sm pt-popover-dismiss" to="/admin">
                  <span className="link-icon pt-icon-standard pt-icon-series-configuration" />
                  { t("Admin") }
                </Link> : null }
                {/* log out */}
                <a className="link font-sm pt-popover-dismiss" href="/auth/logout">
                  <span className="link-icon pt-icon-standard pt-icon-log-out" />
                  { t("Log out") }
                </a>
              </div>
            </Popover>

            {/* language select */}
            <span className="link language-icon-container">
              <span className="link-icon pt-icon-standard pt-icon-globe" />
            </span>
            <a className="link language-link" key={languageLinks[0].id} href={languageLinks[0].link}>
              {languageLinks[0].shortTitle}
            </a>
            <a className="link language-link" key={languageLinks[1].id} href={languageLinks[1].link}>{languageLinks[1].shortTitle}</a>
          </div>
          : <div className="link-list font-sm">

            {/* login | signup */}
            <button className="link login-link u-unbutton" onClick={this.authForm.bind(this, "login")}>
              <span className="link-icon pt-icon-standard pt-icon-log-in" />
              <span className="link-text u-hide-below-sm">{ t("LogIn.Log_in") }</span>
            </button>
            <button className="link signup-link u-unbutton" onClick={this.authForm.bind(this, "signup")}>
              <span className="link-icon pt-icon-standard pt-icon-new-person" />
              <span className="link-text u-hide-below-sm">{ t("SignUp.Sign Up") }</span>
            </button>

            {/* about */}
            <Link className="link" to="/about">
              <span className="link-icon pt-icon-standard pt-icon-help" />
              <span className="link-text u-hide-below-sm">{ t("About") }</span>
            </Link>

            {/* language select */}
            <a className="link language-link" key={languageLinks[0].id} href={languageLinks[0].link}>
              <span className="link-icon pt-icon-standard pt-icon-globe" />
              {languageLinks[0].title}
            </a>
            <a className="link language-link" key={languageLinks[1].id} href={languageLinks[1].link}>{languageLinks[1].title}</a>
          </div> }
        <Dialog
          className="form-container"
          iconName="inbox"
          isOpen={isLoginOpen}
          onClose={this.authForm.bind(this)}
          title="Dialog header"
        >
          <AuthForm initialMode={this.state.formMode} />
        </Dialog>
      </div>
    );
  }
}

Nav.defaultProps = {
  isHome: true
};

Nav.contextTypes = {
  browserHistory: PropTypes.object
};

const mapStateToProps = state => ({
  auth: state.auth,
  mailgun: state.mailgun,
  social: state.social,
  serverLocation: state.location
});

const mapDispatchToProps = dispatch => ({
  login: userData => {
    dispatch(login(userData));
  },
  resetPassword: email => {
    dispatch(resetPassword(email));
  }
});

Nav = connect(mapStateToProps, mapDispatchToProps)(Nav);
Nav = translate()(Nav);
export default Nav;
