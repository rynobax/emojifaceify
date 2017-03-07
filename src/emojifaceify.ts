import Discord = require('discord.js');
import request = require('request');
import fs = require('fs');
import uuid = require('uuid/v4');
import {replaceFaces} from './face';

import Promise = require('bluebird');
Promise.longStackTraces();

export function emojifaceify(message: Discord.Message): void {
    extractImages(message)
        .then(replaceFaces)
        .then((res: any) => {
            console.log('res: ', res);
        })
        .catch((err) => {
            console.log('err: ', err);
        });
};

function extractImages(message: Discord.Message): Promise<string[]> {
    // Attachment
    const attachmentFds = getAttachmentFds(message.attachments);

    // Embeds
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
        const filePath = getFilePath(fileName);
        request(url)
            .pipe(fs.createWriteStream(filePath))
            .on('finish', () => {
                fs.open(filePath, 'r', (err: NodeJS.ErrnoException, fd: number) => {
                    if (err) {
                        console.log(err);
                        resolve();
                    }else {
                        resolve(fileName);
                    }
                });
            });
    });
}

function getFilePath(imageName: string): string {
    return 'img/in/' + imageName;
}

function getExtension(originalName: string): string {
    return originalName.split('.').pop();
}
