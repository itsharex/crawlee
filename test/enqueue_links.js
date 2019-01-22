import { expect } from 'chai';
import Apify from '../build/index';
import { enqueueLinks } from '../build/enqueue_links';
import { RequestQueue } from '../build/request_queue';

const { utils: { log } } = Apify;

describe('enqueueLinks()', () => {
    let browser;
    let page;

    beforeEach(async () => {
        browser = await Apify.launchPuppeteer({ headless: true, dumpio: true });
        page = await browser.newPage();
        await page.setContent(`<html>
                <head>
                    <title>Example</title>
                </head>
                <body>
                    <p>
                        The ships hung in the sky, much the <a class="click" href="https://example.com/a/b/first">way that</a> bricks don't.
                    </p>
                    <ul>
                        <li>These aren't the Droids you're looking for</li>
                        <li><a href="https://example.com/a/second">I'm sorry, Dave. I'm afraid I can't do that.</a></li>
                        <li><a class="click" href="https://example.com/a/b/third">I'm sorry, Dave. I'm afraid I can't do that.</a></li>
                    </ul>
                    <a class="click" href="https://another.com/a/fifth">The Greatest Science Fiction Quotes Of All Time</a>
                    <p>
                        Don't know, I don't know such stuff. I just do eyes, ju-, ju-, just eyes... just genetic design,
                        just eyes. You Nexus, huh? I design your <a class="click" href="http://cool.com/">eyes</a>.
                    </p>
                </body>
            </html>`);
    });

    afterEach(async () => {
        if (browser) await browser.close();
        page = null;
        browser = null;
    });

    it('works with PseudoUrl instances', async () => {
        const enqueued = [];
        const requestQueue = new RequestQueue('xxx');
        requestQueue.addRequest = async (request) => {
            enqueued.push(request);
        };
        const pseudoUrls = [
            new Apify.PseudoUrl('https://example.com/[(\\w|-|/)*]', { method: 'POST' }),
            new Apify.PseudoUrl('[http|https]://cool.com/', { userData: { foo: 'bar' } }),
        ];

        await enqueueLinks({ page, selector: '.click', requestQueue, pseudoUrls });

        expect(enqueued).to.have.lengthOf(3);

        expect(enqueued[0].url).to.be.eql('https://example.com/a/b/first');
        expect(enqueued[0].method).to.be.eql('POST');
        expect(enqueued[0].userData).to.be.eql({});

        expect(enqueued[1].url).to.be.eql('https://example.com/a/b/third');
        expect(enqueued[1].method).to.be.eql('POST');
        expect(enqueued[1].userData).to.be.eql({});

        expect(enqueued[2].url).to.be.eql('http://cool.com/');
        expect(enqueued[2].method).to.be.eql('GET');
        expect(enqueued[2].userData.foo).to.be.eql('bar');
    });

    it('works with Actor UI output object', async () => {
        const enqueued = [];
        const requestQueue = new RequestQueue('xxx');
        requestQueue.addRequest = async (request) => {
            enqueued.push(request);
        };
        const pseudoUrls = [
            { purl: 'https://example.com/[(\\w|-|/)*]', method: 'POST' },
            { purl: '[http|https]://cool.com/', userData: { foo: 'bar' } },
        ];

        await enqueueLinks({ page, selector: '.click', requestQueue, pseudoUrls });

        expect(enqueued).to.have.lengthOf(3);

        expect(enqueued[0].url).to.be.eql('https://example.com/a/b/first');
        expect(enqueued[0].method).to.be.eql('POST');
        expect(enqueued[0].userData).to.be.eql({});

        expect(enqueued[1].url).to.be.eql('https://example.com/a/b/third');
        expect(enqueued[1].method).to.be.eql('POST');
        expect(enqueued[1].userData).to.be.eql({});

        expect(enqueued[2].url).to.be.eql('http://cool.com/');
        expect(enqueued[2].method).to.be.eql('GET');
        expect(enqueued[2].userData.foo).to.be.eql('bar');
    });

    it('works with string pseudoUrls', async () => {
        const enqueued = [];
        const requestQueue = new RequestQueue('xxx');
        requestQueue.addRequest = async (request) => {
            enqueued.push(request);
        };
        const pseudoUrls = [
            'https://example.com/[(\\w|-|/)*]',
            '[http|https]://cool.com/',
        ];

        await enqueueLinks({ page, selector: '.click', requestQueue, pseudoUrls });

        expect(enqueued).to.have.lengthOf(3);

        expect(enqueued[0].url).to.be.eql('https://example.com/a/b/first');
        expect(enqueued[0].method).to.be.eql('GET');
        expect(enqueued[0].userData).to.be.eql({});

        expect(enqueued[1].url).to.be.eql('https://example.com/a/b/third');
        expect(enqueued[1].method).to.be.eql('GET');
        expect(enqueued[1].userData).to.be.eql({});

        expect(enqueued[2].url).to.be.eql('http://cool.com/');
        expect(enqueued[2].method).to.be.eql('GET');
        expect(enqueued[2].userData).to.be.eql({});
    });

    it('works with undefined pseudoUrls[]', async () => {
        const enqueued = [];
        const requestQueue = new RequestQueue('xxx');
        requestQueue.addRequest = async (request) => {
            enqueued.push(request);
        };

        await enqueueLinks({ page, selector: '.click', requestQueue });

        expect(enqueued).to.have.lengthOf(4);

        expect(enqueued[0].url).to.be.eql('https://example.com/a/b/first');
        expect(enqueued[0].method).to.be.eql('GET');
        expect(enqueued[0].userData).to.be.eql({});

        expect(enqueued[1].url).to.be.eql('https://example.com/a/b/third');
        expect(enqueued[1].method).to.be.eql('GET');
        expect(enqueued[1].userData).to.be.eql({});

        expect(enqueued[2].url).to.be.eql('https://another.com/a/fifth');
        expect(enqueued[2].method).to.be.eql('GET');
        expect(enqueued[2].userData).to.be.eql({});

        expect(enqueued[3].url).to.be.eql('http://cool.com/');
        expect(enqueued[3].method).to.be.eql('GET');
        expect(enqueued[3].userData).to.be.eql({});
    });

    it('works with null pseudoUrls[]', async () => {
        const enqueued = [];
        const requestQueue = new RequestQueue('xxx');
        requestQueue.addRequest = async (request) => {
            enqueued.push(request);
        };

        await enqueueLinks({ page, selector: '.click', requestQueue, pseudoUrls: null });

        expect(enqueued).to.have.lengthOf(4);

        expect(enqueued[0].url).to.be.eql('https://example.com/a/b/first');
        expect(enqueued[0].method).to.be.eql('GET');
        expect(enqueued[0].userData).to.be.eql({});

        expect(enqueued[1].url).to.be.eql('https://example.com/a/b/third');
        expect(enqueued[1].method).to.be.eql('GET');
        expect(enqueued[1].userData).to.be.eql({});

        expect(enqueued[2].url).to.be.eql('https://another.com/a/fifth');
        expect(enqueued[2].method).to.be.eql('GET');
        expect(enqueued[2].userData).to.be.eql({});

        expect(enqueued[3].url).to.be.eql('http://cool.com/');
        expect(enqueued[3].method).to.be.eql('GET');
        expect(enqueued[3].userData).to.be.eql({});
    });

    it('works with empty pseudoUrls[]', async () => {
        const enqueued = [];
        const requestQueue = new RequestQueue('xxx');
        requestQueue.addRequest = async (request) => {
            enqueued.push(request);
        };

        await enqueueLinks({ page, selector: '.click', requestQueue, pseudoUrls: [] });

        expect(enqueued).to.have.lengthOf(4);

        expect(enqueued[0].url).to.be.eql('https://example.com/a/b/first');
        expect(enqueued[0].method).to.be.eql('GET');
        expect(enqueued[0].userData).to.be.eql({});

        expect(enqueued[1].url).to.be.eql('https://example.com/a/b/third');
        expect(enqueued[1].method).to.be.eql('GET');
        expect(enqueued[1].userData).to.be.eql({});

        expect(enqueued[2].url).to.be.eql('https://another.com/a/fifth');
        expect(enqueued[2].method).to.be.eql('GET');
        expect(enqueued[2].userData).to.be.eql({});

        expect(enqueued[3].url).to.be.eql('http://cool.com/');
        expect(enqueued[3].method).to.be.eql('GET');
        expect(enqueued[3].userData).to.be.eql({});
    });

    // TODO Remove with 1.0.0
    it('works with individual args instead of options object', async () => {
        const enqueued = [];
        const queue = new RequestQueue('xxx');
        queue.addRequest = async (request) => {
            enqueued.push(request);
        };
        const purls = [
            new Apify.PseudoUrl('https://example.com/[(\\w|-|/)*]', { method: 'POST' }),
            new Apify.PseudoUrl('[http|https]://cool.com/', { userData: { foo: 'bar' } }),
        ];

        const originalLogWarning = log.warning;
        const logOutput = [];
        log.warning = (item) => { logOutput.push(item); };

        try {
            await enqueueLinks(page, '.click', purls, queue, { hello: 'world' });

            expect(enqueued).to.have.lengthOf(3);

            expect(enqueued[0].url).to.be.eql('https://example.com/a/b/first');
            expect(enqueued[0].method).to.be.eql('POST');
            expect(enqueued[0].userData).to.be.eql({ hello: 'world' });

            expect(enqueued[1].url).to.be.eql('https://example.com/a/b/third');
            expect(enqueued[1].method).to.be.eql('POST');
            expect(enqueued[1].userData).to.be.eql({ hello: 'world' });

            expect(enqueued[2].url).to.be.eql('http://cool.com/');
            expect(enqueued[2].method).to.be.eql('GET');
            expect(enqueued[2].userData).to.be.eql({ hello: 'world', foo: 'bar' });
        } finally {
            log.warning = originalLogWarning;
        }

        expect(logOutput.length).to.be.eql(1);
        expect(logOutput[0]).to.include('options object');
    });
    it('throws with sparse pseudoUrls[]', async () => {
        const enqueued = [];
        const requestQueue = new RequestQueue('xxx');
        requestQueue.addRequest = async (request) => {
            enqueued.push(request);
        };
        const pseudoUrls = [
            new Apify.PseudoUrl('https://example.com/[(\\w|-|/)*]', { method: 'POST' }),
            null,
            new Apify.PseudoUrl('[http|https]://cool.com/', { userData: { foo: 'bar' } }),
        ];

        try {
            await enqueueLinks({ page, selector: '.click', requestQueue, pseudoUrls });
            throw new Error('Wrong error.');
        } catch (err) {
            expect(err.message).to.include('pseudoUrls[1]');
            expect(enqueued).to.have.lengthOf(0);
        }
    });

    it('DEPRECATED: enqueueRequestsFromClickableElements()', async () => {
        const enqueuedUrls = [];
        const queue = new RequestQueue('xxx');
        queue.addRequest = (request) => {
            expect(request.method).to.be.eql('POST');
            enqueuedUrls.push(request.url);

            return Promise.resolve();
        };
        const purls = [
            new Apify.PseudoUrl('https://example.com/[(\\w|-|/)*]'),
            new Apify.PseudoUrl('[http|https]://cool.com/'),
        ];

        await Apify.utils.puppeteer.enqueueRequestsFromClickableElements(page, '.click', purls, queue, { method: 'POST' });

        expect(enqueuedUrls).to.be.eql([
            'https://example.com/a/b/first',
            'https://example.com/a/b/third',
            'http://cool.com/',
        ]);
    });
});
