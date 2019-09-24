let g_containerBackground = {
	"out": {
		"color": { "a": 0.0 },
		"queue": true
	},
	"in": {
		"color": { "a": 0.4 },
	},
	"fadeIn": function ()
	{
		let settings = Object.assign({ "start": this.out }, this.in)
		animateObject("dialogBackground", settings);
	},
	"fadeOut": function ()
	{
		let settings = Object.assign({ "start": this.in }, this.out)
		animateObject("dialogBackground", settings);
	}
};

let g_container = {
	"out": {
		"size": "50%-300 0%+50 50%+300 100%-50",
		"color": "40",
		"onStart": () =>
		{
			Engine.GetGUIObjectByName("scrollBoxDisplace").hidden = true;
			Engine.GetGUIObjectByName("scrollBarTrack").hidden = true;
			GUIReact.emit("restartMessage", "onClose");
		},
		"onComplete": () => autocivCL.Engine.PopGUIPage({}),
		"queue": true,
	},
	"in": {
		"size": "50%-420 0%+20 50%+420 100%-20",
		"color": "40"
	},
	"fadeIn": function ()
	{
		let settings = Object.assign({ "start": this.out }, this.in)
		animateObject("dialog", settings);
	},
	"fadeOut": function ()
	{
		let settings = Object.assign({ "start": this.in }, this.out, { "color": "40 40 40 0" })
		animateObject("dialog", settings);
	}
};

let scrollBarThumb = {
	"init": () =>
	{
		let scrollBarTrack = Engine.GetGUIObjectByName("scrollBarTrack");
		verticalScroller.hookOnMouseWheelEventsFor(scrollBarTrack);
	},
	"assignedGUIObjectName": "scrollBarThumb",
	"view": {
		"displacement": 0,
		"displacementMax": 0,
		"displacementVel": 0,
	},
	"scroll": function (force)
	{
		// If force applied is opposing, stop current velocity.
		if ((force > 0 && this.view.displacementVel < 0) || (force < 0 && this.view.displacementVel > 0))
			this.view.displacementVel = 0;

		// If Alt pressed, go faster
		if (Engine.HotkeyIsPressed("session.orderone"))
			this.view.displacementVel += force * 5 * 5;
		else
			this.view.displacementVel += force * 5;
		this.onUpdate();
	},
	"onMouseWheelDown": function () { this.scroll(+1) },
	"onMouseWheelUp": function () { this.scroll(-1) },
	"whenPressed": {
		"mouse": {
			"x": 0, "y": 0,
			"set": function (coord) { this.x = coord.x; this.y = coord.y; }
		},
		"displacement": 0
	},
	"controling": false,
	"onMouseLeftPress": function ()
	{
		this.whenPressed.mouse.set(g_mouse);
		this.whenPressed.displacement = this.view.displacement;
		this.controling = true;

		animateObject("scrollBarThumb", { "color": "100" });
	},
	"onMouseEnter": function ()
	{
		animateObject("scrollBarThumb", { "color": "80", });
	},
	"onMouseLeave": function ()
	{
		if (!this.controling)
			animateObject("scrollBarThumb", { "color": "70", });
	},
	"onMouseLeftRelease": function ()
	{
		this.controling = false;
		animateObject("scrollBarThumb", { "color": "70" });
	},
	"onUpdate": function ()
	{
		let scrollBox = Engine.GetGUIObjectByName("scrollBox");
		let absBBox = scrollBox.getComputedSize();

		let visibleListLen = Math.min(absBBox.bottom - absBBox.top, this.view.displacementMax);
		let totalListLen = this.view.displacementMax;

		let visibleRatio = 1.0;
		if (totalListLen != 0)
			visibleRatio = visibleListLen / totalListLen;

		let top = this.view.displacement / totalListLen;
		let clamp = v => Math.min(Math.max(v, 0), 1)
		let GUIObject = Engine.GetGUIObjectByName("scrollBarThumb");
		let GUIObjectSize = GUIObject.size;
		GUIObjectSize.rtop = clamp(top) * 100;
		GUIObjectSize.rbottom = clamp(top + visibleRatio) * 100;
		GUIObject.size = GUIObjectSize;
	}
}

var scrollBox = {
	"assignedGUIObjectName": "scrollBox",
	"updateAbsBBox": function ()
	{
		this.absBBox = Engine.GetGUIObjectByName("scrollBox").getComputedSize()
	},
	"updateScrollee": function ()
	{
		let scrollBoxDisplace = Engine.GetGUIObjectByName("scrollBoxDisplace");
		let scrolleeSize = scrollBoxDisplace.size;
		scrolleeSize.top = -scrollBarThumb.view.displacement;
		scrolleeSize.bottom = -scrollBarThumb.view.displacement;
		scrollBoxDisplace.size = scrolleeSize;

		this.updateAbsBBox();
	},
	"updateChild": function (child)
	{
		child.hidden = !this.isChildVisible(child);
	},
	"isChildVisible": function (child)
	{
		let cRect = child.getComputedSize();
		return cRect.top > this.absBBox.top &&
			cRect.bottom < this.absBBox.bottom;
	},
	"setChildVisibility": function (child, visible)
	{
		if (visible && child.hidden)
			child.hidden = false;
		else if (!visible && !child.hidden)
			child.hidden = true;

	},
	"ifFirstVisible": function (i)
	{
		for (; i < this.children.length; ++i)
		{
			if (!this.isChildVisible(this.children[i]))
				break;
			this.setChildVisibility(this.children[i], true);
		}

		for (; i < this.children.length; ++i)
			this.setChildVisibility(this.children[i], false);
	},
	"ifFirstNoVisible": function (i)
	{
		for (; i < this.children.length; ++i)
		{
			if (this.isChildVisible(this.children[i]))
				break;
			this.setChildVisibility(this.children[i], false);
		}

		this.ifFirstVisible(i)
	},
	"onUpdate": function ()
	{
		this.updateScrollee();
		if (!this.children.length)
			return;

		if (this.isChildVisible(this.children[0]))
			this.ifFirstVisible(0);
		else
			this.ifFirstNoVisible(0);
	},
	"onTick": function ()
	{
		this.updateAbsBBox();
		let absBBoxHeight = this.absBBox.bottom - this.absBBox.top;
		let yScrollVisibleHeight = Math.min(absBBoxHeight, scrollBarThumb.view.displacementMax);

		if (scrollBarThumb.controling)
		{
			let containerBackgroundSize = Engine.GetGUIObjectByName("dialogBackground").getComputedSize();
			let windowHeight = containerBackgroundSize.bottom - containerBackgroundSize.top;

			let scroller_barSize = Engine.GetGUIObjectByName("scrollBarThumb").getComputedSize();
			let scroller_barHeight = scroller_barSize.bottom - scroller_barSize.top;

			let sizeRatio = windowHeight / scroller_barHeight;
			let dirLen = (g_mouse.y - scrollBarThumb.whenPressed.mouse.y) * sizeRatio;

			let clamp = v => Math.min(Math.max(v, 0), scrollBarThumb.view.displacementMax - yScrollVisibleHeight)
			scrollBarThumb.view.displacement = clamp(scrollBarThumb.whenPressed.displacement + dirLen);

			this.onUpdate();
			GUIReact.emit("scrollBarThumb", "onUpdate");
			scrollBarThumb.view.displacementVel = 0;
			return;
		}

		scrollBarThumb.view.displacementVel *= 0.92
		scrollBarThumb.view.displacementVel = Math.abs(scrollBarThumb.view.displacementVel) < 1 ? 0 : scrollBarThumb.view.displacementVel;

		if (scrollBarThumb.view.displacement + yScrollVisibleHeight > scrollBarThumb.view.displacementMax && scrollBarThumb.view.displacementVel > 0)
			scrollBarThumb.view.displacement = scrollBarThumb.view.displacementMax - yScrollVisibleHeight + Math.exp(Math.log(Math.abs(scrollBarThumb.view.displacementVel)));
		if (scrollBarThumb.view.displacement < 0 && scrollBarThumb.view.displacementVel < 0)
			scrollBarThumb.view.displacement = 0 - Math.exp(Math.log(Math.abs(scrollBarThumb.view.displacementVel)));
		else
			scrollBarThumb.view.displacement += scrollBarThumb.view.displacementVel;

		if (scrollBarThumb.view.displacementVel)
		{
			this.onUpdate();
			GUIReact.emit("scrollBarThumb", "onUpdate");
		}

	},
	"init": function ()
	{
		animateObject("scrollBarTrack", {
			"start": { "color": "40" },
			"color": "50",
			"duration": 1500,
			"delay": 400,
		});

		animateObject("scrollBarThumb", {
			"start": { "color": "40" },
			"color": "70",
			"duration": 500,
			"delay": 200,
		});

		this.children = Engine.GetGUIObjectByName("scrollBoxDisplace").children;
	}
};

function setComboCallback(data)
{
	if (!data || !data.saveNewCombo)
		return;
	saveHotkeyCombo(data.i, data.value);
}

function saveHotkeyCombo(i, comboValueString)
{
	if (comboValueString == "")
		comboValueString = "unused";

	if (userConfig.dataByIndex[i].value === comboValueString)
		return false;

	userConfig.dataByIndex[i].value = comboValueString;

	let key = userConfig.dataByIndex[i].list.join(".");
	let value = userConfig.dataByIndex[i].value;

	Engine.ConfigDB_CreateValue("user", key, value);
	Engine.ConfigDB_WriteValueToFile("user", key, value, "config/user.cfg");
	comboGenerator(i);
	GUIReact.emit("restartMessage", "onOpen");
}


function comboGenerator(i)
{
	let data = userConfig.dataByIndex[i];

	let children = Engine.GetGUIObjectByName(`setting_value_text[${i}]`).children;
	let combo = data.value.
		split("+").
		slice(0, children.length).
		filter(t => -1 == ["unused", ""].indexOf(t));

	let textWidthAprox = v =>
	{
		let len = Math.max(2.4, v.length) * 13;
		switch (v)
		{
			case "Shift": return len - 14;
			case "Ctrl": return len - 6;
			case "Alt": return len + 2;
			case "Space": return len - 5;
			default: return len;
		}
	};

	let comboLenAcum = combo.
		map(textWidthAprox).
		reduce((acum, value, i) => [...acum, value + acum[i]], [0]);

	children.forEach((child, i) =>
	{
		let hidden = combo[i] == undefined;
		child.hidden = hidden;
		if (hidden)
			animateObject(child, {
				"onComplete": (object) =>
				{
					object.hidden = true;
					object.caption = "";
				},
				"color": "40 40 40 0",
				"textcolor": "150 150 150 0",
			});
		else
			animateObject(child, {
				"size": {
					"left": 4 + comboLenAcum[i],
					"right": 4 + comboLenAcum[i + 1] - 4
				},
				"onStart": (object) =>
				{
					object.hidden = false;
					object.caption = combo[i];
				},
				"color": "40 40 40 255",
				"textcolor": "150 150 150 255",
			});
	})
}

let g_mouse = {
	"x": 0, "y": 0,
	"set": function (coord) { this.x = coord.x; this.y = coord.y; }
};

let userConfig = {
	"assignedGUIObjectName": "userConfig",
	"init": function ()
	{
		this.currentConfig = {};
		this.processDefaultConfig(this.currentConfig);
		this.processUserConfig(this.currentConfig);
		// Has some non hotkeys keys but doesnt matter
		this.autocivDefaultConfig = Engine.ReadJSONFile("autociv_data/default_config.json");
		this.iterator = this.generator(this.currentConfig, 0);
		// Filled on next iterator
		this.dataByIndex = {};
	},
	"cuotaPerCall": 1,
	"i": 0,
	"nestKeyValueInObject": (key, value, object) =>
	{
		let childObject = object;
		for (let i = 0; i < key.length; ++i)
		{
			let prefix = key[i];
			if (i == key.length - 1)
			{
				// Use the fact that no setting can use = in its own name to use it as key for its value
				if (!(prefix in childObject))
					childObject[prefix] = {};
				childObject[prefix]["="] = value;
			}
			else
			{
				if (!(prefix in childObject))
					childObject[prefix] = {};
				childObject = childObject[prefix];
			}
		}
	},
	"processDefaultConfig": function (currentConfig)
	{
		this.defaultConfig = {}
		let configFileByLines = Engine.ReadFileLines("config/default.cfg");
		let currentPrefix = "";

		for (let line of configFileByLines)
		{
			// If line is a prefix
			let prefix = line.match(/^\[(.*)\].*/);
			if (prefix !== null)
			{
				currentPrefix = prefix[1];
				continue;
			}

			// If line is a setting
			let setting = line.match(/^;?(\S+)\W*=\W*\S*/);
			if (setting === null)
				continue;

			let key = [];
			if (currentPrefix != "")
				key.push(...currentPrefix.split("."))
			key.push(...setting[1].split("."))

			if (key[0] == "userreport" || key[0] != "hotkey")
				continue;

			let value = Engine.ConfigDB_GetValue("user", key.join("."));
			this.nestKeyValueInObject(key, value, this.defaultConfig);
			this.nestKeyValueInObject(key, value, currentConfig);
		}
	},
	"processUserConfig": function (currentConfig)
	{
		this.userConfig = {}
		let configFileByLines = Engine.ReadFileLines("config/user.cfg");

		for (let line of configFileByLines)
		{
			// If line is a setting
			let setting = line.match(/^;?(\S+)\W*=\W*\S*/);
			if (setting === null)
				continue;

			let key = setting[1].split(".");

			if (key[0] == "userreport" || key[0] != "hotkey")
				continue;

			let value = Engine.ConfigDB_GetValue("user", key.join("."));
			this.nestKeyValueInObject(key, value, this.userConfig);
			this.nestKeyValueInObject(key, value, currentConfig);
		}
	},
	/**
	 * @param {Array} settingAsArray e.g. ["hotkey","camera","down"]
	 */
	"hasDefaultValue": function (settingAsArray)
	{
		let level = this.defaultConfig;
		for (let key of settingAsArray)
		{
			if (level[key] === undefined)
				return undefined;
			level = level[key];
		}
		if (("=" in level) && ("" !== level["="]))
			return level["="]
		return undefined;
	},
	"hasAutocivDefaultValue": function (settingAsArray)
	{
		let hotkey = settingAsArray.join(".");
		if (hotkey in this.autocivDefaultConfig)
			if (this.autocivDefaultConfig[hotkey] != "unused")
				return this.autocivDefaultConfig[hotkey];
		return undefined;
	},
	"generator": (data) =>
	{
		let __generatorCounter = 0;

		function* _generator(data, list)
		{
			let keys = Object.keys(data).filter(v => v != "=");
			const noMerge = keys.length > 1;

			if ("=" in data) yield {
				"key": list[list.length - 1],
				"value": data["="],
				"list": list,
				"i": __generatorCounter++
			}
			else if (noMerge) yield {
				"key": list[list.length - 1],
				"value": "",
				"list": list,
				"folder": true,
				"i": __generatorCounter++
			}

			keys.sort();
			for (let key of keys)
			{
				if (noMerge)
					yield* _generator(data[key], [...list, key]);
				else if (list.length == 0)
					yield* _generator(data[key], [key]);
				else
				{
					list[list.length - 1] += "." + key;
					yield* _generator(data[key], list);
				}
			}
		}

		return _generator(data, []);
	},
	"generateItem": function (i)
	{
		let data = this.dataByIndex[i];

		// #####################################################################

		let setting = Engine.GetGUIObjectByName(`setting[${i}]`);
		let yPos = (i, s) => 10 + 5 * i + 25 * (i + s);
		scrollBarThumb.view.displacementMax = yPos(i + 0.5, 1);
		GUIReact.emit("scrollBarThumb", "onUpdate");
		verticalScroller.hookOnMouseWheelEventsFor(setting);
		GUIObjectSet(setting, {
			"size": { "top": yPos(i, 0), "bottom": yPos(i, 1) }
		});

		scrollBox.updateChild(setting);

		// #####################################################################

		let setting_key_text_bg_color = data.folder ? "10" : "30";
		let setting_key_text = Engine.GetGUIObjectByName(`setting_key_text[${i}]`);
		verticalScroller.hookOnMouseWheelEventsFor(setting_key_text);
		setting_key_text.onMouseLeave = () => animateObject(setting_key_text,
			{ "color": setting_key_text_bg_color });
		setting_key_text.onMouseEnter = () => animateObject(setting_key_text,
			{ "color": "70" });
		setting_key_text.caption = (data.folder ? "▼  " : '[color="45 45 45 255"]●[/color]  ') + data.key;
		animateObject(setting_key_text, {
			"start": {
				"color": "40",
				"size": { "left": 10, "right": data.folder ? 402 : 0 },
				"textcolor": { "a": 0 },
			},
			"textcolor": { "a": 1.0 },
			"size": { "left": 10 + 20 * Math.max(0, data.list.length - 2) },
			"color": setting_key_text_bg_color,
		});

		// #####################################################################

		if (data.folder)
			return;

		// #####################################################################

		let setting_value_bg_color = "20";
		let setting_value = Engine.GetGUIObjectByName(`setting_value[${i}]`);
		verticalScroller.hookOnMouseWheelEventsFor(setting_value);
		setting_value.hidden = false;
		animateObject(setting_value, {
			"start": {
				"color": "40",
			},
			"color": setting_value_bg_color,
			"size": { "left": 0, "right": -10, },
		});

		// #####################################################################

		let setting_value_text = Engine.GetGUIObjectByName(`setting_value_text[${i}]`);
		setting_value_text.onPress = () =>
		{
			scrollBarThumb.view.displacementVel = 0;
			autocivCL.Engine.PushGuiPage("autociv_settings/page_key_assign_dialog.xml", {
				"absoluteSize": setting_value_text.getComputedSize(),
				"data": data
			}, setComboCallback)
		}
		setting_value_text.onMouseLeftRelease = setting_value_text.onPress;
		setting_value_text.onMouseLeave = () => animateObject(setting_value_text, {
			"color": setting_value_bg_color
		});
		setting_value_text.onMouseEnter = () => animateObject(setting_value_text, {
			"color": "70"
		});
		verticalScroller.hookOnMouseWheelEventsFor(setting_value_text);
		animateObject(setting_value_text, {
			"start": { "color": "40" },
			"color": setting_value_bg_color,
		});

		// #####################################################################

		comboGenerator(i);

		// #####################################################################

		if (this.hasDefaultValue(data.list) !== undefined ||
			this.hasAutocivDefaultValue(data.list) !== undefined)
		{
			let value_reset_bg_color = "20 20 20 255";
			let setting_value_reset = Engine.GetGUIObjectByName(`setting_value_reset[${i}]`);
			setting_value_reset.tooltip = "Reset to default value";
			verticalScroller.hookOnMouseWheelEventsFor(setting_value_reset);
			setting_value_reset.onMouseLeave = () => animateObject(setting_value_reset, {
				"color": value_reset_bg_color,
				"textcolor": "60"
			});
			setting_value_reset.onMouseEnter = () => animateObject(setting_value_reset, {
				"textcolor": "0 255 0"
			});
			setting_value_reset.onMouseLeftRelease = () =>
			{
				animateObject(setting_value_reset, { "color": "100" });
				let value = this.hasDefaultValue(data.list);
				if (value === undefined)
					value = this.hasAutocivDefaultValue(data.list);
				if (value == undefined)
					return;

				saveHotkeyCombo(i, value);
			};
			setting_value_reset.onMouseLeftPress = () => animateObject(setting_value_reset, {
				"color": "120"
			});
			animateObject(setting_value_reset, {
				"start": {
					"color": "40 40 40 0",
					"textcolor": { "a": 0 },
				},
				"onStart": object => object.hidden = false,
				"color": value_reset_bg_color,
				"textcolor": { "a": 1.0 },
			});
		}

		// #####################################################################

		let value_clear_bg_color = "20 20 20 255";
		let setting_value_clear = Engine.GetGUIObjectByName(`setting_value_clear[${i}]`);
		setting_value_clear.tooltip = "Clear value (set to unused)";
		verticalScroller.hookOnMouseWheelEventsFor(setting_value_clear);
		setting_value_clear.onMouseLeave = () => animateObject(setting_value_clear, {
			"color": value_clear_bg_color,
			"textcolor": "60"
		});
		setting_value_clear.onMouseEnter = () => animateObject(setting_value_clear, {
			"textcolor": "255 0 0"
		});
		setting_value_clear.onMouseLeftRelease = () =>
		{
			animateObject(setting_value_clear, { "color": "100" });
			saveHotkeyCombo(i, "unused");
		}
		setting_value_clear.onMouseLeftPress = () => animateObject(setting_value_clear, {
			"color": "120"
		});
		animateObject(setting_value_clear, {
			"start": {
				"color": "40 40 40 0",
				"textcolor": { "a": 0 },
			},
			"color": value_clear_bg_color,
			"textcolor": { "a": 1.0 },
		});

		// #####################################################################
	},
	"onLoadChunk": function ()
	{
		let done = false;
		for (let cuotaCount = 0; cuotaCount < this.cuotaPerCall;)
		{
			const data = this.iterator.next();
			if (data.done)
			{
				done = true;
				break;
			}

			if (Engine.GetGUIObjectByName(`setting[${data.value.i}]`) === undefined)
			{
				warn("Can't add more hotkeys entries. Maximum exceeded!");
				done = true;
				break;
			}

			this.dataByIndex[data.value.i] = data.value;
			this.generateItem(data.value.i);
			++cuotaCount;
		}

		if (!done)
			setTimeout(() => GUIReact.emit("userConfig", "onLoadChunk"), 1)
	},
};

let restartMessage = {
	"assignedGUIObjectName": "restartMessage",
	"onOpen": function ()
	{
		animateObject("restartMessage", {
			"onStart": object =>
			{
				object.hidden = false;
			},
			"color": "0 0 0 190",
			"textcolor": "200 40 40 255",
		});

	},
	"onClose": function ()
	{
		animateObject("restartMessage", {
			"onComplete": object =>
			{
				object.hidden = true;
			},
			"color": "0 0 0 0",
			"textcolor": "200 0 0 0",
		});
	},
	"onMouseLeftRelease": function ()
	{
		this.onClose();
	}
}

function close()
{
	g_containerBackground.fadeOut();
	g_container.fadeOut();
}

let verticalScroller = {
	"hookOnMouseWheelEventsFor": function (GUIObject)
	{
		GUIObject.onMouseWheelUp = () => GUIReact.emit("scrollBarThumb", "onMouseWheelUp");
		GUIObject.onMouseWheelDown = () => GUIReact.emit("scrollBarThumb", "onMouseWheelDown");
	}
};

function init()
{
	GUIReact.register("scrollBox", scrollBox);
	GUIReact.register("scrollBarThumb", scrollBarThumb);
	GUIReact.register("userConfig", userConfig);
	GUIReact.register("restartMessage", restartMessage);

	Object.assign(Engine.GetGUIObjectByName("dialog"), {
		onMouseWheelUp: () => GUIReact.emit("scrollBarThumb", "onMouseWheelUp"),
		onMouseWheelDown: () => GUIReact.emit("scrollBarThumb", "onMouseWheelDown"),
		onWindowResized: () => scrollBox.onUpdate()
	});

	scrollBox.updateScrollee();
	g_containerBackground.fadeIn();
	g_container.fadeIn();

	scrollBox.init();
	scrollBarThumb.init();
	userConfig.init();

	GUIReact.emit("userConfig", "onLoadChunk");
}

function onTick()
{
	scrollBox.onTick();
	updateTimers();
}

// In case I want to update this later on
function saveDirectMappingToFile()
{
	let SDL_keycode_value_to_constant = Engine.ReadJSONFile("autociv_data/SDL_keycode_value_to_constant.json");
	let SDL_keycode_constant_to_0ad_key = Engine.ReadJSONFile("autociv_data/SDL_keycode_constant_to_0ad_key.json");
	let SDL_keycode_value_to_0ad_key = {};

	for (let value in SDL_keycode_value_to_constant)
	{
		if (SDL_keycode_value_to_constant[value] in SDL_keycode_constant_to_0ad_key)
			SDL_keycode_value_to_0ad_key[value] = SDL_keycode_constant_to_0ad_key[SDL_keycode_value_to_constant[value]];
	}

	Engine.WriteJSONFile("config/mapping.json", SDL_keycode_value_to_0ad_key);
}

function handleInputBeforeGui(ev)
{
	switch (ev.type)
	{
		case "mousebuttondown":
			g_mouse.set(ev);
			break;
		case "mousebuttonup":
			g_mouse.set(ev);
			GUIReact.emit("scrollBarThumb", "onMouseLeftRelease")
			break;
		case "mousemotion":
			g_mouse.set(ev);
			break;
	}
	return false;
}
