import React, {Component} from "react";
import {translate} from "react-i18next";
import {connect} from "react-redux";
import SelectSchool from "components/SelectSchool";
import "./Checkpoint.css";

/** 
 * Checkpoint is a one-time pop-up that asks the user to fill in his or her school/location
 * Originally intended to be a more generic "Checkpoint" system that would support arbitrary 
 * banners/messages, it is currently only used for gathering school info
 */

class Checkpoint extends Component {

  constructor(props) {
    super(props);
    this.state = {
      sid: null
    };
  }

  setSid(sid) {
    this.setState({sid});
    if (this.props.completed) this.props.completed(sid);
  }

  render() {

    const {sid} = this.state;

    return (
      <SelectSchool sid={sid} callback={this.setSid.bind(this)} />
    );
  }
}

Checkpoint = connect(state => ({
  auth: state.auth
}))(Checkpoint);
Checkpoint = translate()(Checkpoint);
export default Checkpoint;
