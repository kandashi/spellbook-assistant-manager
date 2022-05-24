![](https://img.shields.io/badge/Foundry-v0.8.9-informational)
![Latest Release Download Count](https://img.shields.io/github/downloads/kandashi/spellbook-assistant-manager/latest/module.zip)

![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fspellbook-assistant-manager&colorB=4aa94a)

# SAM

## Class Item

SAM is designed to make managing separate spellcasting classes easier. You must configure spells to add for the class through the Advancement Tab.
When a class is added to an actor, or leveled up, a prompt will appear in the same way that normal class features are added. Spells added through this advancement mechanism will have their spellcasting ability set to the "owning" class's spellcasting ability; this helps prevent situations where multiclassing characters have the wrong casting modifier set.

## Actor Sheet

### Spellbook Tab

On the actor sheet, in the spellbook tab, an additional field has been added to denote which class "owns" each spell

![actor spellbook](https://github.com/kandashi/spellbook-assistant-manager/blob/master/images/actor-spellbook.png?raw=true)

## Item Sheet

The source class data can be changed in the item itself, under the Source Class field, and will update the casting modifier to match.

![item source class](https://github.com/kandashi/spellbook-assistant-manager/blob/master/images/item-source.png?raw=true)

### API

To access the stored data on spell source class, it is stored as a flag under `spellbook-assistant-manager.class`.
