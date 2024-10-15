import React, { PureComponent } from "react";
import PlayScreen from "./gui/PlayScreen";
import querystring from "query-string";
import quickp2p, { SimpleStore } from "quickp2p";
import PlayScreenEgg from "./gui/PlayScreenEgg";

// quickp2p.setStore(new SimpleStore("https://misc.r-labs.io"));
quickp2p.setStore(
	new SimpleStore(
		"https://roodriiigooo-token-holder.netlify.app/.netlify/functions/server"
	)
);
// quickp2p.setStore(new SimpleStore("http://localhost:5000"));

export default class App extends PureComponent {
	render() {
		const route = window.location.hash;

		if (route.startsWith("#/join"))
			return <PlayScreen token={this.inviteToken} />;
		else if (route.startsWith("#/egg")) {
			return <PlayScreenEgg egg={this.eggToken} />;
		} else return <PlayScreen />;
	}

	UNSAFE_componentWillMount() {
		this._listener = window.addEventListener("hashchange", (e) => {
			this.forceUpdate();
		});
	}

	componentWillUnmount() {
		window.removeEventListener("hashchange", this._listener);
	}

	get inviteToken() {
		return querystring.parse(window.location.search).token;
	}

	get eggToken() {
		return querystring.parse(window.location.search).egg;
	}
}
