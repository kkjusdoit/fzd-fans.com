# 《植物大战饭圈》AI 生图素材清单与 Prompt

> 用途:替换游戏内 emoji 占位素材。生成后统一放 `public/game/pvz/` 目录,代码中把 emoji 绘制改为 drawImage。
> 版权注意:prompt 只描述"卡通塔防风格",**不要**在 prompt 里写 "Plants vs Zombies 风格/PopCap",避免生成结果与原作素材实质近似。

## 统一风格后缀(每条 prompt 末尾都拼上)

```
cute cartoon tower-defense game asset, thick dark outline, bright saturated colors,
glossy shading, front-facing 3/4 view, single character centered,
plain white background (for easy cutout), no text, 1024x1024
```

透明底可要求 `transparent background PNG`(部分模型支持),否则白底生成后抠图。

## 一、植物(防御单位)6 张

| 文件名 | 现 emoji | Prompt 主体(中文意图 → 英文提示词) |
|---|---|---|
| plant-paddle.png | 🏓 | A cheerful anthropomorphic red table-tennis paddle character planted in soil like a plant, wooden handle as stem with two small green leaves at base, big cartoon eyes on the paddle face, poised to flick a ping-pong ball |
| plant-sunflower.png | 🌻 | A smiling sunflower character with a shiny gold medal as its face center instead of seeds, petals glowing warm yellow, two leaf arms raised happily |
| plant-table.png | canvas 自绘球桌 | An upright blue table-tennis table standing vertically like a shield wall, white boundary lines and center line, sturdy metal legs braced against the ground, cartoon dents and scratches showing battle damage |
| plant-robot.png | 🤖 | A cute retro serving-machine robot on wheels, funnel-shaped ball launcher head loaded with ping-pong balls, spiral spin effect at the muzzle suggesting piercing topspin shots |
| plant-referee.png | ❄️ | An ice-blue referee character shaped like a frosty snow plant, wearing a referee cap and whistle, holding up a small yellow card, frost particles around |
| plant-balloon.png | 🎈 | A whimsical red hot-air balloon weapon with a small wicker basket, a lit fuse and tiny sparks around the balloon, descending toward the battlefield moments before exploding, playful and energetic rather than dangerous |

## 二、僵尸(饭圈怪)7 张

僵尸统一要求:`shambling cartoon zombie, greenish skin, tattered clothes, comical not scary, holding a smartphone`(饭圈僵尸人手一部手机,身份靠道具区分)

| 文件名 | 现 emoji | 身份道具差异 |
|---|---|---|
| zombie-follower.png | 🧟 | plain zombie scrolling its phone blankly, question marks floating above head |
| zombie-troll.png | 🧟💬 | zombie with multiple chat-bubble stickers stuck all over its body, typing on two phones at once |
| zombie-blamer.png | 🧟🍳 | zombie carrying a huge black cooking pot on its back, pointing finger sideways at someone else |
| zombie-conspiracy.png | 🧟🕵️ | zombie in a detective trench coat, surrounded by floating conspiracy notes, holding a small throwing axe ready to hurl |
| zombie-shield.png | 🧟🛡️ | heavily armored zombie holding an oversized metal shield covered with muted chat bubbles, blocking attacks while projecting a suppressive control aura |
| zombie-data.png | 🧟📈 | zombie operating several smartphones at once, surrounded by artificial rising data charts and fake engagement counters, teal tech accessories, acting as a support unit that restores nearby zombies |
| zombie-boss.png | 🧟📢 | giant boss zombie holding a huge megaphone, wearing a cape made of trending-topic banners, crowd of tiny phone screens floating around it, imposing but comical |

## 三、道具/特效 5 张

| 文件名 | 现 emoji/绘制 | Prompt 主体 |
|---|---|---|
| sun-medal.png | 🥇+canvas 光晕 | A glowing golden sun with a gold championship medal embedded in its center, radiating warm rays, sparkling |
| ball-normal.png | canvas 圆 | A white ping-pong ball with motion blur streak, cartoon style |
| ball-ice.png | canvas 圆 | An ice-crystal coated ping-pong ball trailing frost particles |
| weapon-axe.png | 🪓 | A small cartoon throwing axe spinning rapidly in flight, exaggerated motion streaks, comical enemy projectile |
| lawnmower.png | 🚜 | A small red vintage lawnmower with cartoon eyes, ready to charge |

## 四、可选场景 2 张

| 文件名 | Prompt 主体 |
|---|---|
| bg-lawn.png | Top-down cartoon lawn battlefield, 9x5 grid of alternating light/dark green grass tiles, wooden fence borders, warm afternoon light — no characters |
| bg-menu.png | Cartoon lawn at dawn, a lone table-tennis paddle planted like a sapling in the foreground, zombie silhouettes with glowing phone screens approaching from far right horizon |

## 接入顺序建议
1. 先换 7 张僵尸(观感提升最大)
2. 再换 6 张植物
3. 最后道具/背景(现 canvas 绘制的阳光效果其实不差,可最后替换)

代码接入:预加载 `const IMG = {}; ['zombie-follower',...].forEach(n => { IMG[n]=new Image(); IMG[n].src='/game/pvz/'+n+'.png'; })`,drawEnemy/drawDefender 里 `ctx.drawImage` 替换 `fillText(emoji)`,保留现有摇摆/血条/名牌逻辑。
