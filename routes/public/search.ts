import { event } from '#src/utils';
import { getJson } from "serpapi";

export const search = async () => {
    try {
        const response = await getJson({
            engine: 'google_light',
            api_key: process.env.SERPAPI_KEY,
            q: event.queryStringParameters?.q || 'test',
            google_domain: 'google.ca',
            gl: 'us',
            hl: 'en',
            num: 100,
            device: 'desktop',
        });
        
        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'text/html; charset=UTF-8',
                'Cache-Control': 'no-cache' 
            },
            body: formatSearchResults(response, event.queryStringParameters?.q || 'test')
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'text/html' },
            body: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>SearchRoo</title>
                    <style>body{font-family:Arial, sans-serif; padding:20px;}</style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo">🦘 search<span style="color:orange;">roo</span></div>
                    </div>
                    <div style="color:red; margin-top:20px;">Error: ${error.message}</div>
                </body>
                </html>
            `
        };
    }
};

function formatSearchResults(response, query) {
    // Extract key components from the response
    const organicResults = response.organic_results || [];
    const relatedQuestions = response.related_questions || [];
    const relatedSearches = response.related_searches || [];
    const answerBox = response.answer_box;
    
    // Get search speed
    const searchTime = response.search_metadata?.total_time_taken || null;
    
    // Build the HTML
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${query} - SearchRoo</title>
            <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                color: #202124;
                max-width: 800px;
                margin: 0 auto;
            }
            .header {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                margin-right: 20px;
            }
            form {
                display: flex;
                margin-bottom: 20px;
                width: 100%;
            }
            input[name="q"] {
                flex-grow: 1;
                padding: 12px 16px;
                border: 1px solid #dfe1e5;
                border-radius: 24px;
                font-size: 16px;
                outline: none;
            }
            input[name="q"]:focus {
                box-shadow: 0 1px 6px rgba(32,33,36,0.28);
            }
            button {
                background-color: #f8f9fa;
                border: 1px solid #f8f9fa;
                border-radius: 4px;
                color: #3c4043;
                font-size: 14px;
                margin-left: 12px;
                padding: 0 16px;
                height: 36px;
                cursor: pointer;
            }
            button:hover {
                box-shadow: 0 1px 1px rgba(0,0,0,.1);
                background-color: #f8f9fa;
                border: 1px solid #dadce0;
                color: #202124;
            }
            .search-stats {
                color: #70757a;
                font-size: 14px;
                margin-bottom: 20px;
            }
            .answer-box {
                background-color: #f8f9fa;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 20px;
                box-shadow: 0 1px 6px rgba(32,33,36,0.28);
            }
            .phonetic {
                color: #70757a;
                font-size: 16px;
            }
            .definitions p {
                margin-bottom: 8px;
            }
            .result {
                margin-bottom: 25px;
                padding-bottom: 5px;
                border-bottom: 1px solid #ebebeb;
            }
            .title {
                color: #1a0dab;
                font-size: 18px;
                text-decoration: none;
                font-weight: normal;
                margin-bottom: 5px;
                display: block;
            }
            .title:hover {
                text-decoration: underline;
            }
            .url {
                color: #006621;
                font-size: 14px;
                margin-bottom: 5px;
            }
            .snippet {
                color: #4d5156;
                font-size: 14px;
                line-height: 1.58;
            }
            .related-questions, .related-searches {
                margin-top: 30px;
            }
            .related-question {
                border: 1px solid #dfe1e5;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 12px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                cursor: pointer;
            }
            .question {
                font-weight: bold;
                margin-bottom: 8px;
                color: #202124;
            }
            .answer {
                color: #4d5156;
            }
            .search-terms {
                display: flex;
                flex-wrap: wrap;
            }
            .search-term {
                background-color: #f1f3f4;
                border-radius: 18px;
                padding: 8px 16px;
                margin: 0 8px 8px 0;
                color: #202124;
                text-decoration: none;
                display: inline-block;
            }
            .search-term:hover {
                background-color: #e8eaed;
            }
            h3 {
                color: #202124;
                font-size: 18px;
                font-weight: normal;
                margin: 25px 0 15px 0;
            }
        </style>
        </head>
        <body>
        <div class="header">
            <div class="logo">🦘 search<span style="color:orange;">roo</span></div>
        </div>
        
        <form>
            <input name="q" placeholder="Start searching..." value="${query || ''}"/>
            <button type="submit">Search</button>
        </form>
        
        <div class="search-stats">
            About ${organicResults.length} results ${searchTime ? `(${searchTime.toFixed(2)} seconds)` : ''}
        </div>
        
        ${answerBox ? formatAnswerBox(answerBox, query) : ''}
        
        <div class="results">
            ${organicResults.slice(0, 10).map(formatResult).join('')}
        </div>
        
        ${relatedQuestions.length > 0 ? formatRelatedQuestions(relatedQuestions) : ''}
        
        ${relatedSearches.length > 0 ? formatRelatedSearches(relatedSearches) : ''}
        </body>
        </html>
    `;
}

function formatAnswerBox(answerBox, query) {
    if (answerBox.type === "dictionary_results") {
        return `
            <div class="answer-box">
                <h3>${query}</h3>
                <p class="phonetic">${answerBox.phonetic || ''}</p>
                <div class="definitions">
                    <p><strong>${answerBox.word_type || ''}</strong></p>
                    ${answerBox.definitions.map(def => `<p>• ${def}</p>`).join('')}
                </div>
            </div>
        `;
    }
    return '';
}

function formatResult(result) {
    return `
        <div class="result">
            <a href="${result.link}" class="title">${result.title}</a>
            <div class="url">${result.displayed_link}</div>
            <div class="snippet">${result.snippet || ''}</div>
        </div>
    `;
}

function formatRelatedQuestions(questions) {
    return `
        <div class="related-questions">
            <h3>People also ask</h3>
            ${questions.map(q => `
                <div class="related-question">
                    <div class="question">${q.question}</div>
                    <div class="answer">${q.snippet || ''}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function formatRelatedSearches(searches) {
    return `
        <div class="related-searches">
            <h3>Related searches</h3>
            <div class="search-terms">
                ${searches.map(s => `<a href="?q=${encodeURIComponent(s.query)}" class="search-term">${s.query}</a>`).join('')}
            </div>
        </div>
    `;
}