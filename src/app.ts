import * as express from 'express';
import { Classifier, Email } from './classifier';
import * as fileUpload from 'express-fileupload';
import * as bodyParser from 'body-parser';

class App {
    public express;
    public classifier: Classifier = Classifier.Instance;

    constructor () {
        this.express = express();
        this.express.use(fileUpload());
        this.express.use(bodyParser.urlencoded());
        this.mountRoutes();
        this.initTemplate();
    }

    private initTemplate(): void {
        this.express.set('views', './views');
        this.express.set('view engine', 'twig');
        this.express.set('twig options', {
            strict_variables: false
        });
    };

    private mountRoutes (): void {
        const router = express.Router();
        router.get('/', (req, res) => {
            res.render('index.html.twig', {
                classifier: this.classifier.classifier,
            });
        });
        router.post('/', (req, res) => {
            let subject = req.body.subject;
            let body = req.body.body;
            let email: Email = {subject, body} as Email;

            res.render('index.html.twig', {
                subject,
                body,
                classificationResults: this.classifier.classify(email),
                classifier: this.classifier.classifier,
            });
        });
        router.post('/train', (req, res) => {
            let file = req.files.trainFile;
            this.classifier.trainByXlsx(file.data);

            res.redirect('/');
        });
        router.get('/clear', (req, res) => {
            this.classifier.clear();

            res.redirect('/');
        });
        this.express.use('/', router);
    }
}

export default new App().express
