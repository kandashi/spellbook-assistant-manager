import SelectItemsPrompt from "/systems/dnd5e/module/apps/select-items-prompt.js";
import Item5e from "/systems/dnd5e/module/item/entity.js";

Hooks.once('ready', async function () {
    libWrapper.register("spellbook-assistant-manager", "CONFIG.Item.documentClass.prototype._onUpdate", spellManager.wrapLevelUp, "WRAPPER")
    libWrapper.register("spellbook-assistant-manager", "CONFIG.Item.documentClass.prototype._onCreate", spellManager.wrapLevelUp, "WRAPPER")

});

Hooks.on("renderItemSheet", (itemSheet, html, data) => {
    if (data.itemType !== "Class") return;
    let content = $(`
    <div class="tab details" data-group="primary" data-tab="spellbook">
    </div>
    `)
    let X = new spellManager(itemSheet, content)
    X.assembleHtml()
    X.activateListeners()
    let tab = `<a class="item" data-tab="spellbook">Spellbook</a>`
    html.find(".sheet-navigation").append(tab)
    html.find(".sheet-body").append(content)
    html.find('.spellbook[data-edit]').each((i, div) => itemSheet._activateEditor(div));
})

export class spellManager {

    constructor(item, html) {
        this.itemSheet = item
        this.content = html
    }

    get maxSlot() {
        let prog = this.itemSheet.object.data.data.spellcasting.progression
        let maxLevel = 0
        switch (prog) {
            case "third": maxLevel = Math.floor(20 / 3); break;
            case "half": maxLevel = Math.floor(20 / 2); break;
            case "full": maxLevel = 20; break;
            case "artificer": maxLevel = Math.ceil(20 / 2); break;
            case "pact": maxLevel = 20; break;
        }
        return CONFIG.DND5E.SPELL_SLOT_TABLE[maxLevel - 1]
    }

    async assembleHtml() {
        for (let i = 0; i < this.maxSlot.length + 1; i++) {
            let name = i > 0 ? `Level ${i}` : "Cantrip"
            this.content.append(`<h3>${name}</h3>
           <div class="editor" id="spellbook">
           <div class="editor-content spellbook" data-edit="flags.spellbook-assistant-manager.slot-${i}">${TextEditor.enrichHTML(this.itemSheet.object.getFlag(`spellbook-assistant-manager`, `slot-${i}`)) || ""}</div>
            <a class="editor-edit">
            <i class="fas fa-edit" id="spellButton"></i>
            </a></div></div>
           <br>`)
        }
    }

    activateListeners() {
        this.content.on("click", "#spellButton", (e) => {
            $(e.currentTarget).closest("#spellbook").toggleClass("expand")
        })
    }

    static async getLeveledSpells({ actor, className, level }) {
        this.className = className
        const existing = new Set(actor.items.map(i => i.name));
        let classItem = actor.items.getName(className);
        let classLevel = classItem.data.data.levels
        let maxLevel = 0
        switch (classItem.data.data.spellcasting.progression) {
            case "third": maxLevel = Math.floor(classLevel / 3); break;
            case "half": maxLevel = Math.floor(classLevel / 2); break;
            case "full": maxLevel = level; break;
            case "artificer": maxLevel = Math.ceil(classLevel / 2); break;
            case "pact": maxLevel = classLevel; break;
        }
        let html = classItem.getFlag("spellbook-assistant-manager", `slot-${CONFIG.DND5E.SPELL_SLOT_TABLE[maxLevel - 1].length}`)
        let div = document.createElement("div")
        div.innerHTML = html
        let spells = await this.getItems(div)
        return spells.filter(f => !existing.has(f.name)) || [];
    }

    static async getItems(div) {
        const entityTypes = CONST.ENTITY_LINK_TYPES.concat("Compendium");
        const rgx = new RegExp(`@(${entityTypes.join("|")})\\[([^\\]]+)\\](?:{([^}]+)})?`, 'g');
        const matches = div.textContent.matchAll(rgx)
        let items = []
        for (let match of Array.from(matches).reverse()) {
            let i = await fromUuid(`${match[1]}.${match[2]}`)
            items.push(i)
        }
        return items
    }

    static async addEmbeddedItems(items, prompt = true, name, actor) {
        let classAbl = actor.classes[`${name.slugify({ strict: true })}`].data.data.spellcasting.ability
        let itemsToAdd = items;
        if (!items.length) return [];

        // Obtain the array of item creation data
        let toCreate = [];
        if (prompt) {
            const itemIdsToAdd = await SelectItemsPrompt.create(items, {
                hint: game.i18n.localize("DND5E.AddEmbeddedItemPromptHint")
            });
            for (let item of items) {
                if (itemIdsToAdd.includes(item.id)) toCreate.push(item.toObject());
            }
        } else {
            toCreate = items.map(item => item.toObject());
        }

        toCreate.forEach(i => {
            i.flags["spellbook-assistant-manager"] = { class: name }
            i.data.ability = classAbl
            i.data.save.scaling = classAbl
        })

        // Create the requested items
        if (itemsToAdd.length === 0) return [];
        return Item5e.createDocuments(toCreate, { parent: actor });
    }


    static async wrapLevelUp(wrapped, ...args) {
        wrapped(...args)
        if (args[2] !== game.user.id) return;
        const isCharacterClass = this.parent && (this.parent.type !== "vehicle") && (this.type === "class");
        if (!isCharacterClass) return;

        // Prompt to add new class features
        const addFeatures = args[0].name || (args[0].data && ["subclass", "levels"].some(k => k in args[0].data));
        if (!addFeatures || (args[1].addFeatures === false)) return;
        spellManager.getLeveledSpells({
            actor: this.parent,
            className: args[0].name || this.name,
            level: args[0].data?.levels || this.data.data.levels
        }).then(spells => {
            return spellManager.addEmbeddedItems(spells, args[1].promptAddFeatures, this.name, this.parent);
        });
    }

    static levelUp(actor) {
        let classes = actor.classes
        let options = ""
        for (const val in classes) {
            options += `<label class="radio-label">
            <input type="radio" name="classes" value="${classes[val].id}">
            <img src="${classes[val].img}" style="border:0px; width: 50px; height:50px;">
            ${val}
          </label>`
        }
        let content = `
        <form class="flexcol classes">
        <div class="form-group" id="classes">
        ${options}
    </div>
            </form>
        `
        new Dialog({
            title: game.i18n.localize("sam.levelPrompt"),
            content: content,
            buttons: {
                yes: {
                    icon: `<i class="fas fa-caret-square-up"></i>`,
                    label: game.i18n.localize("sam.levelConfirm"),
                    callback: async (html) => {
                        let id = $("input[type='radio'][name='classes']:checked").val();
                        let classItem = actor.items.get(id)
                        await classItem.update({ "data.levels": classItem.data.data.levels + 1 })
                    }
                }
            }
        }).render(true)
    }

}

class spellOverrides {
    static async createContentLink(match, type, target, name) {

        // Prepare replacement data
        const data = {
            cls: ["entity-link"],
            icon: null,
            dataset: {},
            name: name
        };
        let broken = false;

        // Get a matched World document
        if (CONST.ENTITY_TYPES.includes(type)) {

            // Get the linked Document
            const config = CONFIG[type];
            const collection = game.collections.get(type);
            const document = /^[a-zA-Z0-9]{16}$/.test(target) ? collection.get(target) : collection.getName(target);
            if (!document) broken = true;

            // Update link data
            data.name = data.name || (broken ? target : document.name);
            //data.icon = document.data.img
            data.dataset = { entity: type, id: broken ? null : document.id };
        }

        // Get a matched Compendium entity
        else if (type === "Compendium") {

            // Get the linked Entity
            let [scope, packName, id] = target.split(".");
            const pack = game.packs.get(`${scope}.${packName}`);
            if (pack) {
                data.dataset = { pack: pack.collection };
                data.icon = CONFIG[pack.metadata.entity].sidebarIcon;

                // If the pack is indexed, retrieve the data
                if (pack.index.size) {
                    const index = pack.index.find(i => (i._id === id) || (i.name === id));
                    if (index) {
                        if (!data.name) data.name = index.name;
                        const document = await pack.getDocument(id)
                        //data.icon = document.data.img
                        data.dataset.id = index._id;
                    }
                    else broken = true;
                }

                // Otherwise assume the link may be valid, since the pack has not been indexed yet
                if (!data.name) data.name = data.dataset.lookup = id;
            }
            else broken = true;
        }

        // Flag a link as broken
        if (broken) {
            data.icon = "fas fa-unlink";
            data.cls.push("broken");
        }

        // Construct the formed link
        const a = document.createElement('a');
        a.classList.add(...data.cls);
        a.draggable = true;
        for (let [k, v] of Object.entries(data.dataset)) {
            a.dataset[k] = v;
        }
        a.innerHTML = `<i class="${data.icon}"></i> ${data.name}`;
        return a;
    }

    static async enrichHTML(content, { secrets = false, entities = true, links = true, rolls = true, rollData } = {}) {

        // Create the HTML element
        const html = document.createElement("div");
        html.innerHTML = String(content);

        // Remove secret blocks
        if (!secrets) {
            let elements = html.querySelectorAll("section.secret");
            elements.forEach(e => e.parentNode.removeChild(e));
        }

        // Plan text content replacements
        let updateTextArray = true;
        let text = [];

        // Replace entity links
        if (entities) {
            if (updateTextArray) text = TextEditor._getTextNodes(html);
            const entityTypes = CONST.ENTITY_LINK_TYPES.concat("Compendium");
            const rgx = new RegExp(`@(${entityTypes.join("|")})\\[([^\\]]+)\\](?:{([^}]+)})?`, 'g');
            updateTextArray = await spellOverrides._replaceTextContent(text, rgx, spellOverrides.createContentLink);
        }
        // Return the enriched HTML
        return html.innerHTML;
    };

    static async _replaceTextContent(text, rgx, func) {
        let replaced = false;
        for (let t of text) {
            const matches = t.textContent.matchAll(rgx);
            for (let match of Array.from(matches).reverse()) {
                const replacement = await func(...match);
                if (replacement) {
                    TextEditor._replaceTextNode(t, match, replacement);
                    replaced = true;
                }
            }
        }
        return replaced;
    }
}