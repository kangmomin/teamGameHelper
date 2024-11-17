const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const fs = require('fs');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });
const dotenv = require('dotenv');

dotenv.config();

const TOKEN = process.env.TOKEN;

const DATA_FILE = 'data.json';

let data = { teams: {}, userGames: {} };

// JSON 파일에서 데이터 로드
if (fs.existsSync(DATA_FILE)) {
  const rawData = fs.readFileSync(DATA_FILE);
  data = JSON.parse(rawData);
}

const saveData = () => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

client.once('ready', async () => {
  console.log(`로그인 완료: ${client.user.tag}!`);

  // 슬래시 명령어 등록
  const commands = [
    {
      name: '팀_생성',
      description: '새 팀을 생성합니다',
      options: [
        {
          name: '팀_이름',
          type: 3, // 문자열 타입
          description: '생성할 팀의 이름',
          required: true,
        },
      ],
    },
    {
      name: '유저_등록',
      description: '사용자를 팀에 등록합니다',
      options: [
        {
          name: '팀_이름',
          type: 3, // 문자열 타입
          description: '등록할 팀의 이름',
          required: true,
        },
      ],
    },
    {
      name: '유저_제거',
      description: '사용자를 팀에서 제거합니다',
      options: [
        {
          name: '팀_이름',
          type: 3, // 문자열 타입
          description: '제거할 팀의 이름',
          required: true,
        },
      ],
    },
    {
      name: '팀_삭제',
      description: '팀을 삭제합니다',
      options: [
        {
          name: '팀_이름',
          type: 3, // 문자열 타입
          description: '삭제할 팀의 이름',
          required: true,
        },
      ],
    },
    {
      name: '팀_목록',
      description: '모든 팀 목록을 표시합니다',
    },
    {
      name: '팀_멤버_목록',
      description: '팀의 모든 멤버를 표시합니다',
      options: [
        {
          name: '팀_이름',
          type: 3, // 문자열 타입
          description: '팀의 이름',
          required: true,
        },
      ],
    },
    {
      name: '게임_등록',
      description: '사용자가 플레이하는 게임을 등록합니다',
      options: [
        {
          name: '게임_이름',
          type: 3, // 문자열 타입
          description: '등록할 게임의 이름',
          required: true,
        },
      ],
    },
    {
      name: '게임_제거',
      description: '사용자가 등록한 게임을 제거합니다',
    },
    {
      name: '게임_목록',
      description: '등록된 모든 게임을 표시합니다',
    },
    {
      name: '게임_선택',
      description: '팀에서 게임을 선택합니다',
      options: [
        {
          name: '팀_이름',
          type: 3, // 문자열 타입
          description: '팀의 이름',
          required: true,
        },
      ],
    },
  ];

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    console.log('애플리케이션 (/) 명령어 갱신 시작.');

    await rest.put(Routes.applicationCommands(client.user.id), {
      body: commands,
    });

    console.log('애플리케이션 (/) 명령어 갱신 완료.');
  } catch (error) {
    console.error(error);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  try {
    if (commandName === '팀_생성') {
      const teamName = options.getString('팀_이름');
      if (data.teams[teamName]) {
        await interaction.reply({ content: `팀 '${teamName}'은(는) 이미 존재합니다.`, ephemeral: true });
      } else {
        data.teams[teamName] = [];
        saveData();
        await interaction.reply(`팀 '${teamName}'이(가) 생성되었습니다.`);
      }
    }

    if (commandName === '유저_등록') {
      const teamName = options.getString('팀_이름');
      const user = interaction.user;
      if (!data.teams[teamName]) {
        await interaction.reply({ content: `팀 '${teamName}'이(가) 존재하지 않습니다.`, ephemeral: true });
      } else if (data.teams[teamName].includes(user.id)) {
        await interaction.reply({ content: `${user.username}님은 이미 팀 '${teamName}'에 등록되어 있습니다.`, ephemeral: true });
      } else {
        data.teams[teamName].push(user.id);
        saveData();
        await interaction.reply(`${user.username}님이 팀 '${teamName}'에 등록되었습니다.`);
      }
    }

    if (commandName === '유저_제거') {
      const teamName = options.getString('팀_이름');
      const user = interaction.user;
      if (!data.teams[teamName]) {
        await interaction.reply({ content: `팀 '${teamName}'이(가) 존재하지 않습니다.`, ephemeral: true });
      } else if (!data.teams[teamName].includes(user.id)) {
        await interaction.reply({ content: `${user.username}님은 팀 '${teamName}'에 속해 있지 않습니다.`, ephemeral: true });
      } else {
        data.teams[teamName] = data.teams[teamName].filter((id) => id !== user.id);
        saveData();
        await interaction.reply(`${user.username}님이 팀 '${teamName}'에서 제거되었습니다.`);
      }
    }

    if (commandName === '팀_삭제') {
      const teamName = options.getString('팀_이름');
      if (!data.teams[teamName]) {
        await interaction.reply({ content: `팀 '${teamName}'이(가) 존재하지 않습니다.`, ephemeral: true });
      } else {
        delete data.teams[teamName];
        saveData();
        await interaction.reply(`팀 '${teamName}'이(가) 삭제되었습니다.`);
      }
    }

    if (commandName === '팀_목록') {
      if (Object.keys(data.teams).length === 0) {
        await interaction.reply('생성된 팀이 없습니다.');
      } else {
        await interaction.reply(`현재 팀 목록: ${Object.keys(data.teams).join(', ')}`);
      }
    }

    if (commandName === '팀_멤버_목록') {
      const teamName = options.getString('팀_이름');
      if (!data.teams[teamName]) {
        await interaction.reply({ content: `팀 '${teamName}'이(가) 존재하지 않습니다.`, ephemeral: true });
      } else if (data.teams[teamName].length === 0) {
        await interaction.reply(`팀 '${teamName}'에 멤버가 없습니다.`);
      } else {
        const members = data.teams[teamName].map((id) => `<@${id}>`).join(', ');
        await interaction.reply(`팀 '${teamName}'의 멤버: ${members}`);
      }
    }

    if (commandName === '게임_등록') {
      const gameName = options.getString('게임_이름');
      const user = interaction.user;
      if (!data.userGames[user.id]) {
        data.userGames[user.id] = [];
      }
      data.userGames[user.id].push(gameName);
      saveData();
      await interaction.reply(`${user.username}님이 게임 '${gameName}'을(를) 등록했습니다.`);
    }

    if (commandName === '게임_제거') {
      const user = interaction.user;
      if (!data.userGames[user.id] || data.userGames[user.id].length === 0) {
        await interaction.reply({ content: `${user.username}님은 등록된 게임이 없습니다.`, ephemeral: true });
      } else {
        data.userGames[user.id] = [];
        saveData();
        await interaction.reply(`${user.username}님의 게임 등록이 제거되었습니다.`);
      }
    }

    if (commandName === '게임_목록') {
      const games = Object.values(data.userGames).flat();
      if (games.length === 0) {
        await interaction.reply('등록된 게임이 없습니다.');
      } else {
        await interaction.reply(`등록된 게임 목록: ${[...new Set(games)].join(', ')}`);
      }
    }

    if (commandName === '게임_선택') {
      const teamName = options.getString('팀_이름');
      if (!data.teams[teamName]) {
        await interaction.reply({ content: `팀 '${teamName}'이(가) 존재하지 않습니다.`, ephemeral: true });
      } else {
        const teamMembers = data.teams[teamName];
        const games = teamMembers.map((id) => data.userGames[id]).flat().filter(Boolean);
        if (games.length > 0) {
          const selectedGame = games[Math.floor(Math.random() * games.length)];
          await interaction.reply(`팀 '${teamName}'을(를) 위한 게임: ${selectedGame}`);

          // 게임에 참여할 랜덤 유저 선택
          const numUsersToSelect = Math.max(1, Math.floor(games.length / 5));
          const selectedUsers = teamMembers.sort(() => 0.5 - Math.random()).slice(0, numUsersToSelect);
          const selectedUsersMentions = selectedUsers.map((id) => `<@${id}>`).join(', ');
          await interaction.followUp(`게임에 참여할 유저: ${selectedUsersMentions}`);
        } else {
          await interaction.reply(`팀 '${teamName}'의 멤버들이 등록한 게임이 없습니다.`);
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
});

client.login(TOKEN);
