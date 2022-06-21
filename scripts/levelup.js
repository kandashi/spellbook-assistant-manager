
Hooks.on("renderActorSheet", (actor, html) => {


    switch (actor.object.data.flags.core.sheetClass) {
        case "dnd5e.Tidy5eSheet": {
            let headers = html.find(".items-header-comps")
            for (let h of headers) {
                const $div = $(`<div class="items-header-sourceClass" title="Spell Source">Source</div>`)
                h.before($div[0])
            }
            let spells = html.find(".inventory-list.spellbook-list.items-list .item")
            debugger
            for (let s of spells) {
                let id = s.outerHTML.match(/data-item-id="(.*?)"/)
                let item = actor.object.items.get(id[1])
                let advancementID = item.getFlag("dnd5e", "advancementOrigin")
                let itemClass = item.data.flags["spellbook-assistant-manager"]?.class
                let classItem = actor.object.items.get(advancementID?.split(".")[0]) ?? actor.object.classes[`${itemClass?.slugify({ strict: true })}`]
                const $div = $(`
                <div class="item-detail spell-class">
					          <div class="class-image" aria-label="${classItem?.name || ''}" style="background-image: url(${classItem?.img || ''})"></div>
					        </div>
                    `)
                let itemHTML = html.find(`[data-item-id="${id[1]}"]`)
                let name = itemHTML.find(".item-name")
                    name.after($div[0])
            }
        }
            break;
        default: {
            let headers = html.find(".items-header.spellbook-header .spell-school")
            for (let h of headers) {
                const $div = $(`<div class="source-class">Source Class</div>`)
                h.after($div[0])
            }
            let spells = html.find(".spellbook .item .spell-school")
            for (let s of spells) {
                let id = s.parentElement.outerHTML.match(/data-item-id="(.*?)"/)
                let item = actor.object.items.get(id[1])
                let advancementID = item.getFlag("dnd5e", "advancementOrigin")
                let itemClass = item.data.flags["spellbook-assistant-manager"]?.class
                let classItem = actor.object.items.get(advancementID?.split(".")[0]) ?? actor.object.classes[`${itemClass?.slugify({ strict: true })}`]
                const $div = $(`
        <div class="source-class">
            <div class="class-image" aria-label="${classItem?.name || ""}" style="background-image: url(${classItem?.img || ""});"></div>
        </div>
            `)
                s.after($div[0])
            }
        }
    }

})

Hooks.on("renderItemSheet", (sheet, html) => {
    switch (sheet.object.data.flags.core?.sheetClass) {
        case "dnd5e.Tidy5eSheet": {

        }
    }
    if (sheet.object.type === "spell") {
        let school = html.find(`select[name="data.school"]`)[0]
        let itemClass = sheet.object.parent.items.get(sheet.object.data.flags.dnd5e?.advancementOrigin?.split(".")[0])?.name.toLowerCase() || sheet.object.data.flags["spellbook-assistant-manager"]?.class || ""
        let classes = sheet.actor.classes
        let options = ""
        for (const val in classes) {
            options += `<option value="${val}" ${itemClass === val ? 'selected' : ''}>${val.charAt(0).toUpperCase() + val.slice(1)}</option>`
        }
        const $div = $(`
    <div class="form-group">
                    <label>${game.i18n.localize("sam.classSelect")}:</label>
                    <select name="flags.spellbook-assistant-manager.class" data-dtype="String" value=${itemClass}>
                        <option value="" ${itemClass === "" ? 'selected' : ''}></option>
                        ${options}
                    </select>
                </div>    
    `)
        school.parentElement.after($div[0])
    }
})


Hooks.on("preUpdateItem", (item, update) => {
    if (update?.flags) {
        let className = update?.flags["spellbook-assistant-manager"]?.class
        let classItem = item.actor.classes[className.slugify({ strict: true })]
        if (!classItem) return
        let classAbl = classItem.data.data.spellcasting.ability
        let newUp = {
            data: {
                ability: classAbl,
                save: {
                    scaling: classAbl
                }
            }
        }
        return update = mergeObject(update, newUp)
    }
})

Hooks.on("preCreateItem", (item, data, options) => {
    if (item.data.flags.dnd5e?.advancementOrigin) {
        let classItem = item.actor.items.get(item.data.flags.dnd5e.advancementOrigin.split(".")[0])
        if (!classItem) return data;
        let classAbl = classItem.data.data.spellcasting.ability
        let newUp = {
            data: {
                ability: classAbl,
                save: {
                    scaling: classAbl
                }
            }
        }
        return data = mergeObject(data, newUp)
    }
})