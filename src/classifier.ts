import * as natural from 'natural';
import * as xlsx from 'xlsx';
import * as fs from 'fs';


export class Email
{
    public subject: string;
    public body: string;
}

export class ClassificationResult
{
    public label: string|string[];
    public value: number;
}

export class Classifier
{
    public classifier;
    public classifierType = 'BayesClassifier';
    // public classifierType = 'LogisticRegressionClassifier';

    private static _instance: Classifier;

    private constructor() {
        this.createClassifier();
    }

    public createClassifier() {
        if (fs.existsSync(this.dictionaryPath)) {
            let data = JSON.parse(fs.readFileSync(this.dictionaryPath).toString('UTF-8'));
            this.classifier = natural[this.classifierType].restore(data);
        } else {
            this.classifier = new natural[this.classifierType](natural.PorterStemmerRu);
        }
    }

    public trainByXlsx(buffer: Buffer): void {
        let wb = xlsx.read(buffer,{type:'buffer'});

        for (let sheetName in wb.Sheets) {
            let sheet = wb.Sheets[sheetName];
            let document = xlsx.utils.sheet_to_json(sheet);

            document.forEach((document) => {
                let classes = [];

                for (let classKey in document) {
                    if (document.hasOwnProperty(classKey) && ['body', 'subject'].indexOf(classKey) === -1) {
                        classes.push(document[classKey]);
                        if (this.classifierType !== 'BayesClassifier') {
                            this.classifier.addDocument([document['subject'], document['body']], document[classKey]);
                        }
                    }
                }
                if (this.classifierType === 'BayesClassifier') {
                    this.classifier.addDocument([document['subject'], document['body']], classes);
                }
            });
        }
        this.classifier.train();
        this.classifier.save(this.dictionaryPath);
    }

    public classify(email: Email): ClassificationResult[] {
        // const example = ['i am long wat', 'i am long wat'];
        const response = this.classifier.getClassifications([email.subject, email.body]);
        console.log(response);
        console.log(this.classifier.classify([email.subject, email.body]));

        return response;
    }

    public clear(): void {
        if (fs.existsSync(this.dictionaryPath)) {
            fs.unlinkSync(this.dictionaryPath);
        }
        this.createClassifier();
    }

    public get dictionaryPath(): string {
        return `./data/classifier-${this.classifierType}.json`;
    }

    public static get Instance()
    {
        // Do you need arguments? Make it a regular method instead.
        return this._instance || (this._instance = new this());
    }
}
