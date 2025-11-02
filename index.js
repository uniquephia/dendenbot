const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");
require("dotenv").config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const DATA_PATH = "./todo.json";

// 🧠 讀取任務資料
function loadTodos() {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

// 💾 寫入任務資料
function saveTodos(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options } = interaction;
  if (commandName !== "todo") return;

  const subcommand = options.getSubcommand();
  const todos = loadTodos(); // 每次都先讀最新的

  if (subcommand === "add") {
    const task = options.getString("task");
    const assignee = options.getUser("assignee");
    const deadline = options.getString("deadline");

    if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      const embed = new EmbedBuilder()
        .setColor("#ff4c4c")
        .setTitle("❌ 日期格式錯誤")
        .setDescription("請輸入正確格式：`YYYY-MM-DD`");
      return await interaction.reply({ embeds: [embed] });
    }

    const taskData = {
      task,
      deadline,
      assigner: {
        id: interaction.user.id,
        username: interaction.member.nickname || interaction.user.username,
      },
    };

    const id = assignee.id;
    if (!todos[id]) todos[id] = [];
    todos[id].push(taskData);

    saveTodos(todos); // 寫回 JSON

    const embed = new EmbedBuilder()
      .setColor("#57f287")
      .setTitle("✅ 任務已新增")
      .addFields(
        { name: "📌 任務", value: task },
        { name: "👤 執行人", value: `<@${id}>`, inline: true },
        { name: "📅 截止日", value: deadline, inline: true }
      )
      .setFooter({ text: "燈燈小助手 🎧" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }

  if (subcommand === "list") {
    const id = interaction.user.id;
    const tasks = todos[id] || [];

    if (tasks.length === 0) {
      const embed = new EmbedBuilder()
        .setColor("#999999")
        .setTitle("📭 沒有任務")
        .setDescription("你目前沒有被指派任何任務。");
      return await interaction.reply({ embeds: [embed] });
    }

    tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    const embed = new EmbedBuilder()
      .setColor("#5865f2")
      .setTitle("📋 任務清單")
      .setFooter({ text: "燈燈小助手 🎧" })
      .setTimestamp();

    tasks.forEach((t, i) => {
      const date = new Date(t.deadline);
      const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      embed.addFields({
        name: `#${i + 1} - ${t.task}`,
        value: `👤 指派人：${t.assigner.username}\n📅 截止日：${dateString}`,
      });
    });

    await interaction.reply({ embeds: [embed] });
  }

  if (subcommand === "done") {
    const index = options.getInteger("index") - 1;
    const id = interaction.user.id;
    const tasks = todos[id] || [];

    if (index < 0 || index >= tasks.length) {
      const embed = new EmbedBuilder()
        .setColor("#ff9900")
        .setTitle("⚠️ 錯誤的任務編號")
        .setDescription("請輸入有效的任務編號");
      return await interaction.reply({ embeds: [embed] });
    }

    const [doneTask] = tasks.splice(index, 1);
    saveTodos(todos); // 更新 JSON

    const embed = new EmbedBuilder()
      .setColor("#57f287")
      .setTitle("✅ 任務已完成")
      .setDescription("該任務已從你的清單中移除！")
      .addFields(
        { name: "🎭 任務內容", value: doneTask.task },
        { name: "👤 指派人", value: doneTask.assigner.username, inline: true },
        { name: "📅 截止日", value: doneTask.deadline, inline: true }
      )
      .setFooter({ text: "燈燈小助手 🎧" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
