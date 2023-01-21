import React, { Component } from "react";
import Emulator from "../emulator";
import InviteHeader from "./InviteHeader";
import JoinHeader from "./JoinHeader";
import Overlay from "./Overlay";
import Header from "../widgets/Header";
import TVNoise from "../widgets/TVNoise";
import Controls from "../widgets/Controls";
import SettingsButton from "../widgets/SettingsButton";
import helpers from "./helpers";
import config from "../config";
import bus from "../events";
import styles from "./PlayScreenEgg.module.css";
import strings from "../locales";
import classNames from "classnames";
import _ from "lodash";
import {Animated} from "react-animated-css";
// import PlayScreen from "./PlayScreen";


// DEBUG
window.bus = require("../events").default;
window.config = require("../config").default;

export default class PlayScreenEgg extends Component {
	state = { rom: null, syncer: null };
	egg = this.props.egg;

	render() {
		const { token } = this.props;
		const { rom, syncer } = this.state;
		

		// console.log('Token: ' +token);
		// console.log('Rom: ' +rom);
		// console.log('Syncer: ' +syncer);
		// console.log(this.props.egg)
		// console.log('egg: ' + this.egg);
		
		
		return (
			<div className={styles.appegg}>
				{syncer ? (
					<Header>{strings.connected}</Header>
				) : token ? (
					<Animated animationIn="bounceInLeft" animationOut="fadeOut" isVisible={true}>

					<JoinHeader
						onSyncer={this._onSyncer}
						onError={this._onError}
						token={token}
					/>
					</Animated>
				) : (
					<InviteHeader
						onSyncer={this._onSyncer}
						onError={this._onError}
						needsRom={!rom}
					/>
				)}

				{
					<div className={styles.main}>
						<section
							className={classNames(
								styles.gameContainer,
								"nes-container",
								"is-dark",
								"with-title"
							)}
						>
							<div className={styles.overlay}>
								<Overlay />
							</div>

							{rom ? (
								<Emulator
									rom={rom}
									syncer={syncer}
									onStartPressed={this._onStartPressed}
									onError={this._onError}
									ref={(ref) => (this.emulator = ref)}
								/>
							) : (
								<TVNoise />
							)}
						</section>
					</div>
				}

				<div className={styles.controls}>
					<Animated animationIn="bounceInDown" animationOut="fadeOut" isVisible={true}>
						<Controls />
					</Animated>
				</div>

				<div className={styles.menu}>
					<Animated animationIn="bounceInRight" animationOut="fadeOut" isVisible={true}>
						<SettingsButton />
					</Animated>
				</div>
			</div>
		);
	}

	componentDidMount() {
		window.addEventListener("dragover", this._ignore);
		window.addEventListener("dragenter", this._ignore);
		window.addEventListener("drop", this._ignore);
		window.addEventListener('load', this.load);
		if (config.options.crt)
			document.querySelector("#container").classList.add("crt");
	}

	componentWillUnmount() {
		window.removeEventListener("dragover", this._ignore);
		window.removeEventListener("dragenter", this._ignore);
		window.removeEventListener("drop", this._ignore);
		window.removeEventListener('load', this.load)  

	}

	_onSyncer = (syncer) => {
		this.setState({ syncer });

		syncer.on("rom", (rom) => {
			this._loadRom(rom, () => syncer.initializeEmulator(this.emulator), false);
		});
		syncer.on("start", () => this.emulator && this.emulator.start());

		syncer.initializeRom(this.state.rom);
	};

	_loadRom(rom, callback = _.noop, start = true) {
		bus.emit("message", null);

		this.setState({ rom }, () => {
			callback();
			if (start) this.emulator.start();
		});
	}

	_onFileDrop = (e) => {
		e.preventDefault();

		const file = _.first(e.dataTransfer.files);
		const reader = new FileReader();
		if (!file) return;

		reader.onload = (event) => {
			const rom = event.target.result;

			if (this.state.syncer) this.state.syncer.updateRom(rom);
			else this._loadRom(rom);
		};

		reader.readAsArrayBuffer(file);
	};

	_ignore = (e) => {
		e.stopPropagation();
		e.preventDefault();
	};

	_onStartPressed = () => {
		if (!this.state.syncer) return;
		this.state.syncer.onStartPressed();
	};

	_onError = (error, reset = true) => {
		this.setState({ rom: null });
		bus.emit("message", error || strings.errors.connectionFailed);
		if (!reset) return;

		bus.emit("reset");
		this.setState({ syncer: null });
		helpers.cleanQueryString();
		window.location.href = "#/";
	};

	_dataURItoBlob(dataURI) {
		var byteString = dataURI;
		var ab = new ArrayBuffer(byteString.length);
		var ia = new Uint8Array(ab);
		for (var i = 0; i < byteString.length; i++) {
			ia[i] = byteString.charCodeAt(i);
		}
		var bb = new Blob([ab]);
		return bb;
	}


	loadBinary(path, callback) {
		var req = new XMLHttpRequest();
		req.open("GET", path);
		req.responseType = "arraybuffer";
		req.addEventListener('load', function() {
		  if (req.status === 200) {
			callback(null, this.response);
		  } else {
			callback(new Error(req.statusText));
		  }
		});
		req.onerror = function() {
		  callback(new Error(req.statusText));
		};
		req.send();
	}
	
	
	load = () => {
		this.loadBinary('https://raw.githubusercontent.com/roodriiigooo/EGGS/main/' +this.egg, (err, data) => {
		  if (err) {
			this.syncer = { rom: null, syncer: null };
			helpers.cleanQueryString();
			this._onError();
			// return <PlayScreen />;
			// window.alert(`Error loading ROM: ${err.toString()}`);
		  } else {
			this.handleLoaded(data);
		  }
		});
	  };
	
	handleLoaded = data => {
		this.setState({ rom: null });
		this.setState({ syncer: null });
		helpers.cleanQueryString();
		if (this.state.syncer) this.state.syncer.updateRom(data);
			else this._loadRom(data);
	};

	
}

