function hasAdmin(member) {
  return member.permissions.has('Administrator');
}

function saveDB() {
  require('fs').writeFileSync('./database.json', JSON.stringify(db, null, 2));
}

const { Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const TOKEN = 'MTM3MjA0NzM0Mjc5ODExNDg0Ng.GqXVhh.qcld_K9Qu18qibTs8SZjUBFpm2Lu93YfYCp93U';
const dbFile = './database.json';
let db = fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile)) : {};

function saveDB() {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}

function hasAdmin(member) {
  return member.permissions.has(PermissionsBitField.Flags.Administrator);
}

function isOwner(id) {
  return ['1248554227257577494', '699106231066951681', '788675742254891029'].includes(id);
}

client.once('ready', () => {
  console.log(`✅ البوت شغال: ${client.user.tag}`);
});

client.on('voiceStateUpdate', (oldState, newState) => {
  const member = newState.member;
  if (!member || member.user.bot) return;

  const now = Date.now();
  const guildID = newState.guild.id;

  if (newState.channelId && !oldState.channelId) {
    db[`دخول_${member.id}_${guildID}`] = now;
    saveDB();
  } else if (!newState.channelId && oldState.channelId) {
    const دخول = db[`دخول_${member.id}_${guildID}`];
    if (!دخول) return;
    const دقائق = Math.floor((now - دخول) / 60000);
    const ساعات = Math.floor(دقائق / 60);
    const نقاط = Math.floor(دقائق / 10) * 2;

    db[`ساعات_${member.id}_${guildID}`] = (db[`ساعات_${member.id}_${guildID}`] || 0) + ساعات;
    db[`نقاطصوت_${member.id}_${guildID}`] = (db[`نقاطصوت_${member.id}_${guildID}`] || 0) + نقاط;
    delete db[`دخول_${member.id}_${guildID}`];
    saveDB();
  }
});

client.on('messageCreate', async message => {
  if (!message.guild || message.author.bot) return;

  const args = message.content.split(" ");
  const cmd = args[0];
  const guildID = message.guild.id;
  const userID = message.author.id;

  if (cmd === '!تفعيل') {
    if (args[1] === '9370524') {
      db[`تفعيل_${guildID}`] = true;
      saveDB();
      return message.reply('✅ تم تفعيل البوت بنجاح!');
    } else {
      return message.reply('❌ لم يتم كتابة الرمز بشكل صحيح _');
    }
  }

  if (!db[`تفعيل_${guildID}`]) return;

  if (cmd === '!ساعات') {
    const target = message.mentions.users.first() || message.author;
    const ساعات = db[`ساعات_${target.id}_${guildID}`] || 0;
    return message.reply(`⏱️ ${target.username} لديه ${ساعات} ساعة تواجد في الرومات الصوتية.`);
  }

  if (cmd === '!صوت') {
    const target = message.mentions.users.first() || message.author;
    const نقاط = db[`نقاطصوت_${target.id}_${guildID}`] || 0;
    return message.reply(`🔊 ${target.username} لديه ${نقاط} نقطة صوتية.`);
  }

  if (cmd === '!امبد') {
    if (!hasAdmin(message.member)) return;
    const input = message.content.slice(6).split('|');
    const title = input[0]?.trim();
    const desc = input[1]?.trim();
    const image = input[2]?.trim();
    if (!title || !desc) return message.reply('❌ الصيغة: !امبد العنوان | النص | رابط الصورة');
    const em = new EmbedBuilder().setTitle(title).setDescription(desc).setColor('Blue');
    if (image) em.setImage(image);
    message.channel.send({ embeds: [em] });
  }
});

client.login(TOKEN);
client.on('messageCreate', async message => {
  if (!message.guild || message.author.bot) return;

  const args = message.content.split(" ");
  const cmd = args[0];
  const guildID = message.guild.id;
  const userID = message.author.id;

  if (!db[`تفعيل_${guildID}`]) return;

  // نظام النقاط الكتابية
  db[`رسائل_${userID}_${guildID}`] = db[`رسائل_${userID}_${guildID}`] || 0;
  db[`رسائل_${userID}_${guildID}`]++;
  if (db[`رسائل_${userID}_${guildID}`] % 10 === 0) {
    db[`نقاطكتابه_${userID}_${guildID}`] = (db[`نقاطكتابه_${userID}_${guildID}`] || 0) + 2;
    saveDB();
  }

  if (cmd === '!رساله') {
    const target = message.mentions.users.first() || message.author;
    const نقاط = db[`نقاطكتابه_${target.id}_${guildID}`] || 0;
    return message.reply(`💬 ${target.username} لديه ${نقاط} نقطة كتابة.`);
  }

  if (cmd === '!تفاعل') {
    const الكل = message.guild.members.cache.filter(m => !m.user.bot);
    const تفاعل = الكل.map(m => {
      const صوت = db[`نقاطصوت_${m.id}_${guildID}`] || 0;
      const كتابة = db[`نقاطكتابه_${m.id}_${guildID}`] || 0;
      return {
        id: m.id,
        اسم: m.user.username,
        مجموع: صوت + كتابة
      };
    });

    const ترتيب = تفاعل.sort((a, b) => b.مجموع - a.مجموع);
    const top10 = ترتيب.slice(0, 10);
    const انت = ترتيب.find(x => x.id === userID);

    const em = new EmbedBuilder()
      .setTitle(`📊 Top active members`)
      .setColor('Gold')
      .setDescription(
        top10.map((m, i) => `**${i + 1}.** ${m.اسم} – ${m.مجموع} نقطة`).join('\n') +
        (!top10.find(m => m.id === userID) && انت ? `\n\n📌 مركزك: خارج التوب 10، لديك ${انت.مجموع} نقطة.` : '')
      );

    return message.channel.send({ embeds: [em] });
  }

  // !ارسل @منشن [النص]
  if (cmd === '!ارسل') {
    if (!hasAdmin(message.member)) return;
    const mention = message.mentions.users.first();
    const النص = args.slice(2).join(" ");
    if (!mention || !نص) return message.reply('❌ الصيغة: !ارسل @منشن [النص]');
    try {
      await mention.send(`📩 رسالة من ${message.author.username}:\n${نص}`);
      message.reply(`✅ تم إرسال الرسالة لـ ${mention.username}`);
    } catch {
      message.reply('❌ لا يمكن إرسال رسالة لهذا المستخدم.');
    }
  }

  // !ترحيب
  if (cmd === '!ترحيب') {
    if (!hasAdmin(message.member)) return;
    const المنشن = message.mentions.users.first() || message.author;
    const نص_أعلى = '👋 أهلاً بك في السيرفر!';
    const نص_وسط = `مرحباً <@${المنشن.id}> 🎉\nنتمنى لك وقتاً ممتعاً معنا.`;
    const رابط = 'https://media.discordapp.net/attachments/example.gif';

    const em = new EmbedBuilder()
      .setTitle(نص_أعلى)
      .setDescription(نص_وسط)
      .setImage(رابط)
      .setColor('Green');

    message.channel.send({ embeds: [em] });
  }
});
client.on('messageCreate', async message => {
  if (!message.guild || message.author.bot) return;

  const args = message.content.split(" ");
  const cmd = args[0];
  const guildID = message.guild.id;
  const userID = message.author.id;

  if (!db[`تفعيل_${guildID}`]) return;

  // !سجن @منشن [المدة]
  if (cmd === '!سجن') {
    if (!hasAdmin(message.member)) return;
    const member = message.mentions.members.first();
    const مدة = parseInt(args[2]);

    if (!member || isNaN(مدة) || مدة > 60) {
      return message.reply('❌ الصيغة: !سجن @منشن [المدة بالدقائق] (الحد الأقصى 60)');
    }

    message.guild.channels.cache.forEach(channel => {
      channel.permissionOverwrites.edit(member.id, {
        ViewChannel: false
      }).catch(() => {});
    });

    message.reply(`🔒 تم سجن ${member.user.username} لمدة ${مدة} دقيقة.`);

    setTimeout(() => {
      message.guild.channels.cache.forEach(channel => {
        channel.permissionOverwrites.edit(member.id, {
          ViewChannel: null
        }).catch(() => {});
      });
      member.send('✅ تم فك سجنك تلقائيًا.').catch(() => {});
    }, مدة * 60 * 1000);
  }

  // !فك سجن @منشن
  if (cmd === '!فك' && args[1] === 'سجن') {
    if (!hasAdmin(message.member)) return;
    const member = message.mentions.members.first();
    if (!member) return message.reply('❌ الصيغة: !فك سجن @منشن');

    message.guild.channels.cache.forEach(channel => {
      channel.permissionOverwrites.edit(member.id, {
        ViewChannel: null
      }).catch(() => {});
    });

    message.reply(`✅ تم فك سجن ${member.user.username}`);
  }

  // !ميوت @منشن [المدة]
  if (cmd === '!ميوت') {
    if (!hasAdmin(message.member)) return;
    const member = message.mentions.members.first();
    const مدة = parseInt(args[2]);
    if (!member || isNaN(مدة) || مدة > 60) {
      return message.reply('❌ الصيغة: !ميوت @منشن [المدة بالدقائق] (الحد الأقصى 60)');
    }

    await member.timeout(مدة * 60 * 1000, 'تم إعطاؤه ميوت مؤقت');
    message.reply(`🔇 تم إعطاء ${member.user.username} ميوت لمدة ${مدة} دقيقة.`);
  }

  // !فك ميوت @منشن
  if (cmd === '!فك' && args[1] === 'ميوت') {
    if (!hasAdmin(message.member)) return;
    const member = message.mentions.members.first();
    if (!member) return message.reply('❌ الصيغة: !فك ميوت @منشن');

    await member.timeout(null);
    message.reply(`✅ تم فك ميوت ${member.user.username}`);
  }

  // !باند @منشن [المدة اختياري]
  if (cmd === '!باند') {
    if (!hasAdmin(message.member)) return;
    const member = message.mentions.members.first();
    const مدة = parseInt(args[2]);
    if (!member) return message.reply('❌ الصيغة: !باند @منشن [المدة اختيارية]');

    await member.ban({ reason: 'تم حظره بواسطة البوت' });
    message.reply(`⛔ تم حظر ${member.user.username}`);

    if (!isNaN(مدة)) {
      setTimeout(() => {
        message.guild.members.unban(member.id).catch(() => {});
      }, مدة * 60 * 1000);
    }
  }

  // !فك باند [آيدي]
  if (cmd === '!فك' && args[1] === 'باند') {
    if (!hasAdmin(message.member)) return;
    const id = args[2];
    if (!id) return message.reply('❌ الصيغة: !فك باند [آيدي]');
    message.guild.members.unban(id).then(() => {
      message.reply('✅ تم فك الباند.');
    }).catch(() => {
      message.reply('❌ لم يتم العثور على المستخدم أو لم يكن محظوراً.');
    });
  }
});
client.on('messageCreate', async message => {
  if (!message.guild || message.author.bot) return;
  const args = message.content.split(" ");
  const cmd = args[0];
  const guildID = message.guild.id;

  if (!db[`تفعيل_${guildID}`]) return;

  // !اوامر
  if (cmd === '!اوامر') {
    if (!hasAdmin(message.member)) return;

    const كل_الأوامر = [
      '!تفعيل', '!ساعات', '!صوت', '!رساله', '!تفاعل',
      '!ارسل', '!ترحيب', '!سجن', '!فك سجن', '!ميوت',
      '!فك ميوت', '!باند', '!فك باند', '!اوامر', '!صلاحيه',
      '!تعيين', '!امبد', '!تذكره', '!اختبار'
    ];

    const em = new EmbedBuilder()
      .setTitle('📋 قائمة أوامر البوت')
      .setColor('Blue')
      .setDescription(كل_الأوامر.join('\n'));

    message.channel.send({ embeds: [em] });
  }

  // !صلاحيه [آيدي أو منشن] [اسم الأمر]
  if (cmd === '!صلاحيه') {
    if (!hasAdmin(message.member)) return;
    const targetID = args[1]?.replace(/[<@&!>]/g, '');
    const الامر = args[2];
    if (!targetID || !الامر) return message.reply('❌ الصيغة: !صلاحيه [آيدي أو منشن] [الأمر]');
    db[`صلاحية_${targetID}_${الامر}_${guildID}`] = true;
    saveDB();
    message.reply(`✅ تم إعطاء صلاحية استخدام \`${الامر}\` لـ <@${targetID}>`);
  }

  // !تعيين [الأمر]
  if (cmd === '!تعيين') {
    if (!hasAdmin(message.member)) return;
    const الامر = args[1];
    if (!الامر) return message.reply('❌ الصيغة: !تعيين [اسم الأمر]');
    db[`تعيين_${الامر}_${guildID}`] = message.channel.id;
    saveDB();
    message.reply(`✅ تم تفعيل استخدام أمر \`${الامر}\` في هذا الروم فقط.`);
  }

  // التحقق من الأوامر المخصصة بروم معين
  const الامر_المعين = db[`تعيين_${cmd}_${guildID}`];
  if (الامر_المعين && message.channel.id !== الامر_المعين) return;
});
client.on('messageCreate', async message => {
  if (!message.guild || message.author.bot) return;
  const args = message.content.split(" ");
  const cmd = args[0];
  const guildID = message.guild.id;
  const authorID = message.author.id;

  if (!db[`تفعيل_${guildID}`]) return;

  // !امبد العنوان | النص | رابط
  if (cmd === '!امبد') {
    if (!hasAdmin(message.member)) return;
    const input = message.content.slice(6).split('|');
    const title = input[0]?.trim();
    const desc = input[1]?.trim();
    const image = input[2]?.trim();

    if (!title || !desc) return message.reply('❌ الصيغة: !امبد [العنوان] | [النص] | [رابط الصورة]');

    const em = new EmbedBuilder()
      .setTitle(title)
      .setDescription(desc)
      .setColor('Orange');
    if (image) em.setImage(image);
    message.channel.send({ embeds: [em] });
  }

  // !تذكره
  if (cmd === '!تذكره') {
    if (!hasAdmin(message.member)) return;

    const em = new EmbedBuilder()
      .setTitle('🎫 نظام التذاكر')
      .setDescription('يرجى اختيار نوع التذكرة المناسبة:')
      .setColor('Purple')
      .setImage('https://media.discordapp.net/attachments/yourimage.gif');

    message.channel.send({ embeds: [em] });
  }

  // !اختبار
  if (cmd === '!اختبار') {
    if (!hasAdmin(message.member)) return;
    const الأسئله = [
      'ما اسم عاصمة السعودية؟',
      'كم عدد الحروف في الأبجدية؟',
      'ما هو لون شعار ديسكورد؟',
      'ما هو حاصل 7 * 8؟',
      'من هو مؤسس مايكروسوفت؟',
      'ما هي لغة برمجة Discord.js؟',
      'ما هو الحيوان الذي يلقب بملك الغابة؟',
      'ما اسم أكبر محيط في العالم؟',
      'ما عدد أيام السنة؟',
      'ما هو عنصر الماء؟',
      'ما اسم الكوكب الأحمر؟',
      'ما هو عكس كلمة صعب؟',
      'كم عدد لاعبين كرة القدم؟',
      'ما هي عاصمة مصر؟',
      'ما اسم أطول نهر في العالم؟',
      'من هو الرسول محمد؟',
      'ما هو اسمك في ديسكورد؟',
      'كم عدد أصابع اليد؟',
      'ما هو الرقم بعد 99؟',
      'ما هو الحيوان الذي يطير؟'
    ];

    const em = new EmbedBuilder()
      .setTitle('📝 اختبار عام')
      .setDescription(الأسئله.map((s, i) => `**${i + 1}.** ${s}`).join('\n'))
      .setColor('DarkGreen');

    message.channel.send({ embeds: [em] });
  }

  // الكلمات المحظورة
  if (cmd === '!حظر' && args[1] === 'كلمه') {
    if (!hasAdmin(message.member)) return;
    const الكلمه = args.slice(2).join(" ");
    if (!الكلمه) return message.reply('❌ اكتب الكلمة التي تريد حظرها');

    db[`كلمات_${guildID}`] = db[`كلمات_${guildID}`] || [];
    if (!db[`كلمات_${guildID}`].includes(الكلمه)) {
      db[`كلمات_${guildID}`].push(الكلمه);
      saveDB();
      return message.reply(`✅ تم حظر الكلمة: ${الكلمه}`);
    } else {
      return message.reply('⚠️ الكلمة محظورة بالفعل.');
    }
  }

  if (cmd === '!مسح' && args[1] === 'كلمه') {
    if (!hasAdmin(message.member)) return;
    const الكلمه = args.slice(2).join(" ");
    if (!الكلمه) return message.reply('❌ اكتب الكلمة التي تريد مسحها من الحظر');

    db[`كلمات_${guildID}`] = (db[`كلمات_${guildID}`] || []).filter(w => w !== الكلمه);
    saveDB();
    return message.reply(`✅ تم مسح الكلمة: ${الكلمه}`);
  }

  if (cmd === '!قائمه' && args[1] === 'الكلمات') {
    const الكلمات = db[`كلمات_${guildID}`] || [];
    if (الكلمات.length === 0) return message.reply('✅ لا توجد كلمات محظورة.');
    return message.reply(`🔒 الكلمات المحظورة:\n- ${الكلمات.join('\n- ')}`);
  }

  if (cmd === '!تصفير' && args[1] === 'الكل') {
    if (!hasAdmin(message.member)) return;
    delete db[`كلمات_${guildID}`];
    saveDB();
    return message.reply('✅ تم تصفير جميع الكلمات المحظورة.');
  }

  // تعطيل / تفعيل كل الأوامر
  if (cmd === '!تعطيل' && args[1] === 'جميع' && args[2] === 'الاوامر') {
    if (!['1248554227257577494', '699106231066951681', '788675742254891029'].includes(authorID)) return;
    db[`تفعيل_${guildID}`] = false;
    saveDB();
    return message.reply('🛑 تم تعطيل جميع أوامر البوت في هذا السيرفر.');
  }

  if (cmd === '!تفعيل' && args[1] === 'جميع' && args[2] === 'الاوامر') {
    if (!['1248554227257577494', '699106231066951681', '788675742254891029'].includes(authorID)) return;
    db[`تفعيل_${guildID}`] = true;
    saveDB();
    return message.reply('✅ تم تفعيل جميع أوامر البوت من جديد.');
  }
});
const ms = require('ms'); // npm i ms

client.on('messageCreate', async message => {
  if (!message.guild || message.author.bot) return;

  const args = message.content.split(" ");
  const cmd = args[0];
  const guildID = message.guild.id;
  const authorID = message.author.id;

  if (!db[`تفعيل_${guildID}`]) return;

  // !رتبه مؤقته @منشن [رتبة] [مدة]
  if (cmd === '!رتبه' && args[1] === 'مؤقته') {
    if (!hasAdmin(message.member)) return;

    const member = message.mentions.members.first();
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[3]);
    const durationRaw = args[4];
    const duration = ms(durationRaw);

    if (!member || !role || !duration) {
      return message.reply('❌ الصيغة: !رتبه مؤقته @منشن [@رتبة أو آيدي] [المدة h أو d]');
    }

    await member.roles.add(role.id);
    if (!db[`رتب_${guildID}`]) db[`رتب_${guildID}`] = [];
    db[`رتب_${guildID}`].push({
      user: member.id,
      role: role.id,
      expires: Date.now() + duration
    });
    saveDB();

    message.reply(`✅ تم إعطاء الرتبة المؤقتة ${role.name} لـ ${member.user.username} لمدة ${durationRaw}`);
  }

  // !مسح الرتب المؤقته
  if (cmd === '!مسح' && args[1] === 'الرتب' && args[2] === 'المؤقته') {
    if (!hasAdmin(message.member)) return;
    delete db[`رتب_${guildID}`];
    saveDB();
    message.reply('✅ تم مسح كل الرتب المؤقتة.');
  }

  // !عرض الباندات
  if (cmd === '!عرض' && args[1] === 'الباندات') {
    if (!hasAdmin(message.member)) return;

    const bans = await message.guild.bans.fetch();
    if (bans.size === 0) return message.reply('✅ لا يوجد أي باندات في السيرفر.');

    const em = new EmbedBuilder()
      .setTitle('📛 قائمة الباندات')
      .setColor('Red')
      .setDescription(bans.map(b => `- ${b.user.tag} (${b.user.id})`).join('\n'));

    message.channel.send({ embeds: [em] });
  }
});

// تحقق تلقائي من الرتب المؤقتة كل دقيقة
setInterval(() => {
  client.guilds.cache.forEach(guild => {
    const رتب = db[`رتب_${guild.id}`];
    if (!رتب || رتب.length === 0) return;

    const المتبقي = رتب.filter(r => Date.now() < r.expires);
    const المنتهية = رتب.filter(r => Date.now() >= r.expires);

    for (const item of المنتهية) {
      const member = guild.members.cache.get(item.user);
      if (member) member.roles.remove(item.role).catch(() => {});
    }

    db[`رتب_${guild.id}`] = المتبقي;
    saveDB();
  });
}, 60000);
