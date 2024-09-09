import weaviate from 'weaviate-ts-client';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const client = weaviate.client({
    scheme: 'http',
    host: 'localhost:8080',
});

const schemaConfig = {
    'class': 'Meme',
    'vectorizer': 'img2vec-neural',
    'vectorIndexType': 'hnsw',
    'moduleConfig': {
        'img2vec-neural': {
            'imageFields': [
                'image'
            ]
        }
    },
    'properties': [
        {
            'name': 'image',
            'dataType': ['blob']
        },
        {
            'name': 'text',
            'dataType': ['string']
        }
    ]
};

async function main() {
    try {
        const schemaRes = await client.schema.getter().do();
        const classExists = schemaRes.classes.some(cls => cls.class === 'Meme');

        if (!classExists) {
            await client.schema
                .classCreator()
                .withClass(schemaConfig)
                .do();
            console.log('Class "Meme" created.');
        } else {
            console.log('Class "Meme" already exists.');
        }

        const imgPath = './img/jeff2.png';
        if (!existsSync(imgPath)) {
            console.error(`File not found: ${imgPath}`);
            return;
        }
        const img = readFileSync(imgPath);
        const b64 = Buffer.from(img).toString('base64');

        await client.data.creator()
            .withClassName('Meme')
            .withProperties({
                image: b64,
                text: 'matrix meme'
            })
            .do();
        console.log('Data created for class "Meme".');

        const testPath = './test.png';
        if (!existsSync(testPath)) {
            console.error(`File not found: ${testPath}`);
            return;
        }
        const test = Buffer.from(readFileSync(testPath)).toString('base64');

        const resImage = await client.graphql.get()
            .withClassName('Meme')
            .withFields(['image'])
            .withNearImage({ image: test })
            .withLimit(1)
            .do();
        console.log('GraphQL query executed.');

        // Write result to filesystem
        const result = resImage.data.Get.Meme[0].image;
        writeFileSync('./result.jpg', result, 'base64');
        console.log('Result image written to ./result.jpg');
    } catch (err) {
        console.error('An error occurred:', err);
    }
}

main().catch(err => console.error('Main function error:', err));