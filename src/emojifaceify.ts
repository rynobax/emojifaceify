import Discord = require('discord.js');
import request = require('request');
import fs = require('fs');
import uuid = require('uuid/v4');
import {getCustomEmojis, getEmojis} from './emoji';
import {replaceFaces} from './face';

import Promise = require('bluebird');
Promise.longStackTraces();

export function emojifaceify(message: Discord.Message): void {
    Promise.all([extractImages(message), getEmojis(message), getCustomEmojis(message)])
        .then((resArr) => {
            const images = resArr[0];
            const emojis = resArr[1];
            emojis.push(...resArr[2]);
            console.log('emojis: ', emojis);
            if (emojis.length < 1) {
                console.log('hi');
                throw 'You gotta send me an emoji bro';
            }
            return replaceFaces(images, emojis);
        })
        .then((res) => {
            res.forEach((img) => {
                const outFilePath = getOutFilePath(uuid());
                img.write(outFilePath, (err) => {
                    if (err) {
                        throw err;
                    }else {
                        message.reply('Here you go!', {
                            file: outFilePath,
                        })
                        .then(() => {
                            return fs.unlink(outFilePath, (fserr) => {
                                if (fserr) { throw fserr; }
                            });
                        })
                        .catch(Promise.reject);
                    }
                });
            });
        })
        .catch((err) => {
            message.reply(err);
        });
};

function extractImages(message: Discord.Message): Promise<string[]> {
    // Get attachment
    const attachmentFds = getAttachmentFds(message.attachments);

    // Get embeds
    const embedFds = getEmbedFds(message.embeds);

    return Promise.all([attachmentFds, embedFds])
        .then((res: [string[], string[]]): string[] => {
            const arr = [];
            arr.push(...res[0]);
            arr.push(...res[1]);
            return arr;
        })
        .catch((err) => {
            console.log('err: ', err);
        });
}

function getAttachmentFds(attachments: Discord.Collection<string, Discord.MessageAttachment>):
    Promise<string[]> {
    return Promise.all<number>(attachments.array().map((attachment: Discord.MessageAttachment) => {
        // TODO: Check attachment.filename for image suffix
        return getFilestreamFromAttachment(attachment);
    }));
}

function getEmbedFds(embeds: Discord.MessageEmbed[]): Promise<string[]> {
    return Promise.all<string>(embeds.map((embed: Discord.MessageEmbed) => {
        return getFilestreamFromEmbed(embed);
    }));
}

function getFilestreamFromAttachment(attachment: Discord.MessageAttachment): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        resolve(getFileStreamFromUrl(attachment.url));
    });
}

function getFilestreamFromEmbed(embed: Discord.MessageEmbed): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        if (embed.type === 'image') {
            resolve(getFileStreamFromUrl(embed.url));
        }else {
            resolve();
        }
    });
}

function getFileStreamFromUrl(url: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const fileName = uuid() + '.' + getExtension(url);
        const filePath = getInFilePath(fileName);
        request(url)
            .pipe(fs.createWriteStream(filePath))
            .on('finish', () => {
                fs.open(filePath, 'r', (err: NodeJS.ErrnoException, fd: number) => {
                    if (err) {
                        console.log(err);
                        resolve();
                    }else {
                        resolve(filePath);
                    }
                });
            });
    });
}

function getInFilePath(imageName: string): string {
    return 'img/in/' + imageName;
}

function getOutFilePath(imageName: string): string {
    return 'img/out/' + imageName + '.png';
}

function getExtension(originalName: string): string {
    return originalName.split('.').pop();
}
