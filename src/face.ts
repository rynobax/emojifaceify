import fs = require('fs');
import cv = require('opencv');
import _ = require('lodash');
import Jimp = require('jimp');
import uuid = require('uuid/v4');

import Promise = require('bluebird');
Promise.longStackTraces();

interface Face {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Eye {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function replaceFaces(images: string[], emojis: string[]): Promise {
    return Promise.all(images.map((image: string) => {
        return emojifaceifyImage(image, emojis);
    }));
};

function emojifaceifyImage(image: string, emojis: string[]): Promise {
    return getFaces(image).then((resArr) => {
        const faces: Face[] = resArr[0];
        const eyes: Eye[] = resArr[1];
        if (faces.length < 1) {
            throw('No faces in your picture bro!');
        }
        return Jimp.read(image).then((img) => {
            let p = Promise.resolve(img);
            faces.forEach((face) => {
                p = p.then((e) => {
                    return pasteFace(img, face, eyes, emojis);
                });
            });
            p.catch((err) => {
                console.log(err);
            });
            fs.unlink(image);
            return p;
        });
    });
}

function pasteFace(img, face, eyes, emojis: string[]) {
    const emojiFile = emojis[_.random(0, emojis.length - 1)];
    return Promise.resolve()
        .then(() => {
            return Jimp.read(emojiFile);
        })
        .then((emoji) => {
            return addEmoji(img, face, eyes, emoji);
        });
}

function getFaces(image): Promise {
    return new Promise((resolve, reject) => {
        cv.readImage(image, (cverr, img) => {
            if (cverr) {
                console.log(cverr);
                reject(cverr);
                return;
            }
            resolve(Promise.all([cvGetFaces(img), cvGetEyes(img)]));
        });
    });
}

function cvGetFaces(img): Promise {
    return new Promise((resolve, reject) => {
        img.detectObject(cv.FACE_CASCADE, {}, (imerr, faces: Face[]) => {
            if (imerr) {
                reject(imerr);
                return;
            }
            resolve(faces);
        });
    });
}

function cvGetEyes(img): Promise {
    return new Promise((resolve, reject) => {
        img.detectObject(cv.EYE_CASCADE, {}, (imerr, eyes: Eye[]) => {
            if (imerr) {
                reject(imerr);
                return;
            }
            resolve(eyes);
        });
    });
}

function addEmoji(img, face: Face, eyes: Eye[], emoji) {
    const faceEyes = eyes.filter((eye) => {
        return eyeIsInFace(eye, face);
    });

    // Get angle of eyes
    let rotation = 0;
    if (faceEyes.length >= 2) {
        rotation = getEyesAngle(faceEyes);
    }

    return img.composite(emoji.scaleToFit(face.width, face.height).rotate(rotation), face.x, face.y);
}

function eyeIsInFace(eye: Eye, face: Face) {
    const eyeXCen = (eye.x + (eye.width / 2));
    const eyeYCen = (eye.y + (eye.height / 2));
    const xMin = face.x;
    const xMax = face.x + face.width;
    const yMin = face.y;
    const yMax = face.y + face.height;

    if ( eyeXCen > xMin &&
        eyeXCen < xMax &&
        eyeXCen > yMin &&
        eyeYCen < yMax) {
        return true;
    }
    return false;
}

function getEyesAngle(eyes: Eye[]): number {
    let a = null;
    let b = null;
    let minDiff = null;
    for (let i = 0; i < eyes.length - 1; i++) {
        for (let j = i + 1; j < eyes.length; j++) {
            const diff = sizeDifference(eyes[i], eyes[j]);
            if (minDiff === null || diff < minDiff) {
                minDiff = diff;
                a = eyes[i];
                b = eyes[j];
            }
        }
    }

    let aXCen = (a.x + (a.width / 2));
    let bXCen = (b.x + (b.width / 2));

    if (aXCen > bXCen) {
        let temp = a;
        a = b;
        b = temp;
    }

    const x = b.x - a.x;
    const y = b.y - a.y;
    return Math.atan2(y, x) * (180 / Math.PI);
}

function sizeDifference(a: Eye, b: Eye) {
    return Math.abs((a.height * a.width) - (b.height * b.width));
}
