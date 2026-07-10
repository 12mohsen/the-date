# -*- coding: utf-8 -*-
p='i18n.js'
s=open(p,encoding='utf-8').read()

def rep(old,new):
    global s
    assert s.count(old)==1, f"count={s.count(old)} for: {old[:40]!r}"
    s=s.replace(old,new)

# 1) Arabic helper keys
rep(
'''    joinEndsToday:      (target, today) => `⏰ ينتهي الموعد اليوم: ${target} (اليوم ${today}).`,

    // Trash modal''',
'''    joinEndsToday:      (target, today) => `⏰ ينتهي الموعد اليوم: ${target} (اليوم ${today}).`,

    // Equivalent / total wording (used by main.js)
    equivWord:          "تعادل",
    ofWord:             "من أصل",
    gEraSuffix:         " م",
    yearsLabel:         (y) => (y === 1 ? "سنة" : y === 2 ? "سنتين" : y <= 10 ? `${y} سنوات` : `${y} سنة`),

    // Trash modal''')

# 2) English helper keys
rep(
'''    joinEndsToday:      (target, today) => `⏰ The event ends today: ${target} (today is ${today}).`,

    trashTitle:         "🗑 Trash",''',
'''    joinEndsToday:      (target, today) => `⏰ The event ends today: ${target} (today is ${today}).`,

    // Equivalent / total wording (used by main.js)
    equivWord:          "Equivalent to",
    ofWord:             "out of",
    gEraSuffix:         "",
    yearsLabel:         (y) => (y === 1 ? "1 year" : `${y} years`),

    trashTitle:         "🗑 Trash",''')

print("i18n step1-2 done")
open(p,'w',encoding='utf-8').write(s)
