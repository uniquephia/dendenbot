const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('todo')
    .setDescription('任務清單操作')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('新增一筆待辦任務')
        .addStringOption(option =>
          option.setName('task')
            .setDescription('任務內容')
            .setRequired(true)
        )
        .addUserOption(option =>
          option.setName('assignee')
            .setDescription('負責人')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('deadline')
            .setDescription('任務的截止日（格式 YYYY-MM-DD）')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('查看任務清單')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("done")
        .setDescription("標記某個任務為已完成")
        .addIntegerOption(option =>
          option
            .setName("index")
            .setDescription("你要完成的任務編號")
            .setRequired(true)
        )
    )
    .toJSON()
];


module.exports = { commands };

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('⏳ 正在註冊指令...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('✅ 指令已註冊完成！');
  } catch (error) {
    console.error('❌ 註冊指令失敗：', error);
  }
})();
