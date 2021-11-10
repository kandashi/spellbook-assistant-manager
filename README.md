![](https://img.shields.io/badge/Foundry-v0.8.9-informational)
![Latest Release Download Count](https://img.shields.io/github/downloads/kandashi/spellbook-assistant-manager/latest/module.zip)

![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fspellbook-assistant-manager&colorB=4aa94a)

# SAM

## Class Item

SAM is designed to make managing separate spellcasting classes easy. Each class item gains a new Spellbook Tab, which holds available spells for that class.
![class spellbook]()

These fields can be edited like any text field in foundry, simply drag-drop a spell into the field under the appropriate level.

When a class is added to an actor, or leveled up, a prompt will appear in the same way that normal class features are added. Spells added through this mechanism will have their spellcasting ability set to the "owning" class's spellcasting ability; this helps prevent situations where multiclassing characters have the wrong casting modifier set.

## Actor Sheet

## Spellbook Tab

On the actor sheet, in the spellbook tab, an additional field has been added to denote which class "owns" each spell

![actor spellbook]()

## Item Sheet

The source class data can be changed in the item itself, under the Source Class field, and will update the casting modifier to match.

![item source class]()

## Level Up

A "Level Up" button has been added to the class list at the top of the sheet. This will prompt the user to select a single class of pre-existing classes and increment the class level by 1. This will trigger "normal" level up automation.

### API

To access the stored data on spell source class, it is stored as a flag under `spellbook-assistant-manager.class`.
To access to write to a Class's list of spells, they are stored as a flag under `spellbook-assistant-manager.slot-X`.