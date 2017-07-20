import React, {Component} from "react";
import {translate} from "react-i18next";
import {Link} from "react-router";
import {connect} from "react-redux";
import "./Nav.css";

// Nav Component
// Contains a list of links in Footer format, inserted at the bottom of each page

class Nav extends Component {

  render() {

    const {t, user} = this.props;

    return (
      <div id="nav">
        <Link className="link" to={"/"}><img className="logo" src="/logo/logo-sm.png" /></Link>
        <Link className="link" to="/lesson">{ t("Overworld") }</Link>
        <Link className="link" to={`/studio/${user.username}`}>{ t("Studio") }</Link>
        <Link className="link" to="/profile">{ t("Profile") }</Link>
        <a className="link" href="/auth/logout">{ t("Logout") }</a>
      </div>
    );
  }
}

Nav = connect(state => ({
  user: state.auth.user
}))(Nav);
Nav = translate()(Nav);
export default Nav;
