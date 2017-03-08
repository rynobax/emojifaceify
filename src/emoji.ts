import punycode = require('punycode');
import request = require('request');
import _ = require('lodash');
import fs = require('fs');

export function getEmojis({content}: {content: string}): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const codes = getEmojiCodes(content);
        if (codes.length > 0) {
            resolve(getEmojiImages(codes));
        }else {
            resolve([]);
        }
    });
}

export function getCustomEmojis({content}: {content: string}): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const ids = getCustomEmojiIds(content);
        if (ids.length > 0) {
            resolve(getCustomEmojiImages(ids));
        }else {
            resolve([]);
        }
    });
}

function getEmojiCodes(content: string): string[] {
    // Get unique emoji codes from message
    return _.uniq(punycode.ucs2.decode(content)
        .map((e) => e.toString(16))
        .filter((e) => {
            return (e.length > 2);
        }));
}

function getCustomEmojiIds(content: string): string[] {
    // Get unique custom emoji ids from message
    return content.match(/<:.+?:\d+?>/gi)
        .map((full) => {
          return full.substring(full.indexOf(':', 3) + 1, full.length - 1);
        });
}

function getEmojiImages(codes: string[]) {
    // Get paths to emoji images
    return Promise.all(codes.map((code) => getEmojiImage(code)));
}

function getCustomEmojiImages(ids: string[]) {
    return Promise.all(ids.map((id) => getCustomEmojiImage(id)));
}

function getEmojiImage(code: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const filePath = getEmojiPath(code);
        // Check if image exists
        fs.stat(filePath, (err, stats) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    // If not download it
                    resolve(downloadEmojiImage(code));
                } else {
                    reject(err);
                }
                return;
            }
            resolve(filePath);
        });
    });
}

function getCustomEmojiImage(id: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const filePath = getEmojiPath(id);
        // Check if image exists
        fs.stat(filePath, (err, stats) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    // If not download it
                    resolve(downloadCustomEmojiImage(id));
                } else {
                    reject(err);
                }
                return;
            }
            resolve(filePath);
        });
    });
}

function downloadEmojiImage(code: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const filePath = getEmojiPath(code);
        const url = 'https://cdnjs.cloudflare.com/ajax/libs/emojione/2.2.7/assets/png/' + code + '.png';
        request(url)
            .pipe(fs.createWriteStream(filePath))
            .on('finish', () => {
                resolve(filePath);
            });
    });
}

function downloadCustomEmojiImage(id: string): Promise<string> {
    console.log('hello');
    return new Promise((resolve, reject) => {
        const filePath = getEmojiPath(id);
        const url = 'https://cdn.discordapp.com/emojis/' + id + '.png';
        console.log('url: ', url);
        request(url)
            .pipe(fs.createWriteStream(filePath))
            .on('finish', () => {
                resolve(filePath);
            });
    });
}

function getEmojiPath(code: string): string {
    return 'img/emojis/' + code + '.png';
}
