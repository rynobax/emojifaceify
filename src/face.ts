import fs = require('fs');
import cv = require('opencv');

export function replaceFaces(fileNames: string[]): Promise<[string]> {
    return Promise.all(fileNames.map((fileName: string) => {
        return emojifaceifyImage(fileName);
    }));
};

function emojifaceifyImage(fileName: string): Promise<string> {
    console.log('fileName: ', fileName);
    return new Promise((resolve, reject) => {
        cv.readImage(getInFilePath(fileName), (cverr, im) => {
            if (cverr) {
                console.log('cverr');
                reject(cverr);
                return;
            }
            im.detectObject(cv.FACE_CASCADE, {}, (imerr, faces) => {
                if (imerr) {
                    reject(imerr);
                    return;
                }
                console.log('faces: ', faces);
                for (const face of faces){
                    im.ellipse(face.x + face.width / 2, face.y + face.height / 2, face.width / 2, face.height / 2);
                }
                im.save(getOutFilePath(fileName));
                resolve();
            });
        });
    });
}

function getInFilePath(imageName: string): string {
    return 'img/in/' + imageName;
}

function getOutFilePath(imageName: string): string {
    return 'img/out/' + jpgify(imageName);
}

function jpgify(imageName: string): string {
    return imageName.substr(0, imageName.lastIndexOf('.')) + '.jpg';
}
