---
"@pronotron/pointer": patch
"@pronotron/utils": patch
"@pronotron/io": patch
"@pronotron/config-ts": patch
---

### @pronotron/io

- Fix: Adjusted code to support recent NativeControlTable and IDPool breaking changes

### @pronotron/pointer

- Fix: Documentation inconsistencies
- Fix: Minor typos
- Fix: Adjusted code to support recent Animator breaking changes

### @pronotron/utils

**Animator**
- Rename: PronotronAnimationController → PronotronAnimator
- Rename: timeStyle → autoPause boolean
- Rename: 'addAnimation' → 'add', 'removeAnimation' -> 'remove'
- Add: delay property support
- Add: onBegin callback

**Clock**
- Add: getTime() method — returns two elapsed time values
- Docs: Improved code documentation and type safety

**NativeControlTable**
- Rename: 'addSlot' → 'add', 'removeSlot' → 'remove', 'modifySlotByID' → 'modifyByID', 'modifySlotByPosition' → 'modifyByPosition', ..., removed redundant 'slot' prefix from all method names.

**IDPool**
- Rename: 'getID' → 'get', 'consumeID' → 'consume', ..., removed redundant ID suffix from method names.
