const Parser = require('rss-parser');
const { MessageEmbed } = require('discord.js');
const { fetchChannel } = require('../util/common');
const { channels, rss } = require("../util/constants");

const defaultFeeds = new Map([
  // [channels.movies, [
  //   {
  //     author: 'Filmin',
  //     image: 'https://pbs.twimg.com/profile_images/1328657406851768321/BUtkljK-_400x400.jpg',
  //     message: 'Novidades do Filmin',
  //     url: 'https://us14.campaign-archive.com/feed?u=a81c865084161bece1a825249&id=7b4fade1c2'
  //   }
  // ]]
]);

class RssHandler {
  parser = new Parser();
  feeds = defaultFeeds;
  firstRun = true;
  cache = new Map();

  static async start() {
    const handler = new RssHandler();

    handler.listen();
  }

  static async feedParser(handler = new RssHandler()) {
    const parser = handler.parser;

    console.log('Checking registered feeds...');

    for (const [channelName, feeds] of handler.feeds) {
      const channel = fetchChannel({ name: channelName });

      if (!channel) {
        console.log("Channel for feed was not found, aborting.");
        return handler.stop();
      }

      for (const { message, author, image, url } of feeds) {
        let feed = await parser.parseURL(url);

        for (const { guid, title, link, isoDate } of feed.items) {
          const item = [guid, { title, link, isoDate }]

          if (handler.firstRun) {
            handler.cache.set(...item);
          } else if (!handler.cache.has(guid)) {
            console.log(`New item detected in the feed, posting to ${channelName}`);

            channel.send(handler.render({
              message, author, image, item: { title, link }
            }));
            handler.cache.set(...item);
          }
        }

        if (handler.firstRun) {
          handler.firstRun = false;

          console.log(`Dry run, ${handler.cache.size} items were cached from the ${author} feed.`);
        }
      }
    }
  }

  listen() {
    console.log("Starting RSS handler.")

    if (!this.feeds.length) {
      console.log("No feeds were found.")
      return
    }

    this.#parse();

    this.timerId = setInterval(() => { this.#parse() }, rss.pollingInterval);
    console.log(`Set polling interval, timer ${this.timerId} is set to repeat in ${rss.pollingInterval / 60_000}m`);
  }

  stop() {
    clearInterval(this.timerId);
  }

  render({ message, author, image, item }) {
    const msg = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(message)
      .setURL(item.link)
      .setAuthor(author, image, item.link)
      .setDescription(item.title)

    return msg;
  }

  #parse() {
    this.constructor.feedParser(this);
  }
}

module.exports = {
  RssHandler
}
