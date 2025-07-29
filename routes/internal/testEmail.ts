import { sendEmail } from '#src/utils';

export const testEmail = async () => {
    await sendEmail({
        to: `c@htic.io`,
        subject: `Testing`,
        body: `
<div style="max-width:600px;font-family:arial;">
<div style="margin-bottom:10px;">
<span style="display:inline-block;width:150px;font-weight:bold;font-size:20px;">➹ PLAINTEXTY</span>
<span style="display:inline-block;width:calc(100% - 160px);text-align:right;">Wednesday, June 26th, 2024</span>
</div>
<hr/>
<p>Hey Christopher!</p>
<p>This is a test for <span style="color:blue;font-weight:bold;">Plaintexty</span>, a new email campaign service- <i>less noise, more voice</i>.</p>
<p>Our goal is to start generating rich email content for people easily, in a very plaintexty way.</p>
<ul>
<li>Bullet point 1</li>
<li>Bullet point 2 </li>
<li>And bullet point 3!</li>
</ul>
<img style="width:100%" src="https://files.htic.io/2022-11-27.jpg"/>
<p>Schedule a 15 minute meeting to learn more and get <i>1 month free</i>:</p>
<form action="https://api.heythisischris.com/public/test">
<div style="display:inline-block;width:49%;">
<label style="display:block;width:100%;" for="date">Date</label>
<input type="date" id="date" name="date" style="width:100%;" />
</div>
<div style="display:inline-block;width:49%;">
<label style="display:block;width:100%;" for="time">Time</label>
<input type="time" id="time" name="time" style="width:100%;" />
</div>
<div style="margin:10px 0px;">
<label style="display:block;" for="body">Anything else?</label>
<textarea style="width:100%;height:50px;" id="body" name="body"></textarea>
</div>
<button style="display:block;width:100%;height:30px;" type="submit">Schedule meeting</button>
</form>
<p>Thank you,<br/>Texty</p>
<div style="margin:20px 0px;"><hr /></div>
<form action="https://api.heythisischris.com/public/test">
<input type="hidden" name="email" value="c@htic.io" />
<div style="margin:10px 0px;">
<div style="display:block">Did you like this email?</div>
<input type="radio" id="yes" name="rating" value="yes">
<label for="yes">Yes!</label>
<input type="radio" id="maybe" name="rating" value="maybe">
<label for="maybe">Sort of...</label>
<input type="radio" id="no" name="rating" value="no">
<label for="no">Not really</label>
</div>
<div style="margin:10px 0px;">
<label style="display:block;" for="body">Any feedback for us?</label>
<textarea style="width:100%;height:50px;" id="body" name="body"></textarea>
</div>
<button style="display:block;width:100%;height:30px;" type="submit">Submit feedback</button>
</form>
<div style="margin:10px 0px;">
<a href="#" style="margin-right:10px">Manage subscription</a>
<a href="#" style="margin-right:10px">Unsubscribe</a>
</div>
</div>`
    });
    return;
}