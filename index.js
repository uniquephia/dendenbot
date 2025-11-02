const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
require("dotenv").config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 儲存任務 Map：userId => array of task
const todoLists = new Map();

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === "todo") {
    const subcommand = options.getSubcommand();

    // 🔹 任務新增功能
    if (subcommand === "add") {
      const task = options.getString("task");
      const assignee = options.getUser("assignee");
      const deadline = options.getString("deadline");

      // ⛔ 日期格式錯誤
      if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
        const errorEmbed = new EmbedBuilder()
          .setColor("#ff5555")
          .setTitle("❌ 任務新增失敗")
          .setDescription("日期格式不正確，請使用 `YYYY-MM-DD` 格式！");
        return await interaction.reply({ embeds: [errorEmbed] });
      }


      // ✅ 資料寫入
      const taskData = {
        task,
        deadline,
        assigner: interaction.user,
        assignee,
      };

      const id = assignee.id;
      if (!todoLists.has(id)) todoLists.set(id, []);
      todoLists.get(id).push(taskData);

      // ✅ 成功 Embed
      const successEmbed = new EmbedBuilder()
        .setColor("#7bdcb5")
        .setTitle("📌 任務已新增")
        .addFields(
          { name: "🎭 任務內容", value: task, inline: false },
          { name: "👤 執行人", value: `<@${assignee.id}>`, inline: true },
          { name: "🗓️ 截止日", value: deadline, inline: true }
        )
        .setFooter({ text: "劇光燈小助手" })
        .setTimestamp();

      await interaction.reply({ embeds: [successEmbed] });
    }

    // 🔹 任務查詢功能
    if (subcommand === "list") {
      const id = interaction.user.id;
      const tasks = todoLists.get(id) || [];

      // ⛔ 無任務
      if (tasks.length === 0) {
        const noTaskEmbed = new EmbedBuilder()
          .setColor("#aaaaff")
          .setTitle("📭 沒有任務")
          .setDescription("你目前沒有被指派任何任務！");
        return await interaction.reply({ embeds: [noTaskEmbed] });
      }

      // ✅ 有任務，整理排序
      tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

      const embed = new EmbedBuilder()
        .setColor("#ffcc70")
        .setTitle("📝 任務清單")
        .setDescription("以下是你被指派的任務：");

      for (let i = 0; i < tasks.length; i++) {
        const t = tasks[i];
        const date = new Date(t.deadline);
        const dateString = `${date.getMonth() + 1}/${date.getDate()}`;
        const assignerMember = await interaction.guild.members.fetch(t.assigner.id);
        const assignerDisplayName = assignerMember.displayName;

        embed.addFields({
          name: `#${i + 1} - ${t.task}`,
          value: `👤 派任人：${assignerDisplayName}\n🗓️ 截止日：${dateString}`,
        });
      }

      await interaction.reply({ embeds: [embed] });
    }

    if (subcommand === "done") {
      const id = interaction.user.id;
      const index = options.getInteger("index") - 1; // 使用者輸入的是 1 起算

      const tasks = todoLists.get(id) || [];

      // ⛔ 無任務
      if (tasks.length === 0) {
        const embed = new EmbedBuilder()
          .setColor("#cccccc")
          .setTitle("📭 沒有任務")
          .setDescription("你目前沒有任務可以完成！");
        return await interaction.reply({ embeds: [embed] });
      }

      // ⛔ 編號錯誤
      if (index < 0 || index >= tasks.length) {
        const embed = new EmbedBuilder()
          .setColor("#ff5555")
          .setTitle("❌ 任務編號錯誤")
          .setDescription(`請輸入正確的任務編號（1 到 ${tasks.length}）`);
        return await interaction.reply({ embeds: [embed] });
      }

      // ✅ 任務完成
      const [doneTask] = tasks.splice(index, 1); // 移除該任務
      
      const assignerMember = await interaction.guild.members.fetch(doneTask.assigner.id);
      const assignerDisplayName = assignerMember.displayName;

      const deadlineDate = new Date(doneTask.deadline);
      const deadlineString = deadlineDate.toISOString().split("T")[0];
      
      const embed = new EmbedBuilder()
        .setColor("#57f287")
        .setTitle("✅ 任務已完成")
        .setDescription("該任務已從你的清單中移除！")
        .addFields(
          { name: "🎭 任務內容", value: doneTask.task },
          { name: "👤 指派人", value: assignerDisplayName, inline: true },
          { name: "📅 截止日", value: deadlineString, inline: true }
        )
        .setFooter({ text: "燈燈小助手 🎧" })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  }
});

client.login(process.env.TOKEN);
