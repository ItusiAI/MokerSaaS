"use client"

import { useParams } from 'next/navigation'

export function TermsContent() {
  const params = useParams()
  const locale = params.locale as string
  const isZh = locale === 'zh'

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8">
            {isZh ? '服务条款' : 'Terms of Service'}
          </h1>
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-8">
              {isZh ? '最后更新：2026年1月6日' : 'Last updated: January 6, 2026'}
            </p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {isZh ? '1. 服务说明' : '1. Service Description'}
              </h2>
              <p className="mb-4">
                {isZh
                  ? '欢迎使用MokerSaaS（"我们"、"我们的"或"本服务"）。MokerSaaS是一个专业的AI服务平台，为用户提供包括但不限于AI对话、AI图像生成、AI视频生成、AI语音合成、AI音乐生成等多种AI功能服务。'
                  : 'Welcome to MokerSaaS ("we", "our", or "the service"). MokerSaaS is a professional AI service platform that provides users with various AI features including but not limited to AI chat, AI image generation, AI video generation, AI text-to-speech, AI music generation, and more.'
                }
              </p>
              <p className="mb-4">
                {isZh
                  ? '通过访问和使用我们的服务，您同意受本服务条款的约束。如果您不同意本条款的任何部分，请不要使用我们的服务。'
                  : 'By accessing and using our service, you agree to be bound by these Terms of Service. If you do not agree to any part of these terms, please do not use our service.'
                }
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {isZh ? '2. 用户账户' : '2. User Accounts'}
              </h2>
              <p className="mb-4">
                {isZh 
                  ? '为了使用我们的服务，您需要创建一个账户。您必须提供准确、完整和最新的信息。您有责任保护您的账户安全，包括保护您的密码不被泄露。'
                  : 'To use our service, you need to create an account. You must provide accurate, complete, and up-to-date information. You are responsible for protecting your account security, including keeping your password confidential.'
                }
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{isZh ? '您必须年满18岁或在您所在司法管辖区的法定年龄' : 'You must be 18 years old or the legal age in your jurisdiction'}</li>
                <li>{isZh ? '每个用户只能拥有一个账户' : 'Each user can only have one account'}</li>
                <li>{isZh ? '您不得与他人共享您的账户' : 'You may not share your account with others'}</li>
                <li>{isZh ? '您有责任维护账户信息的准确性' : 'You are responsible for maintaining the accuracy of your account information'}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {isZh ? '3. AI服务使用规则' : '3. AI Service Usage Rules'}
              </h2>
              <p className="mb-4">
                {isZh ? '我们的AI服务包括但不限于：' : 'Our AI services include but are not limited to:'}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>{isZh ? 'AI对话' : 'AI Chat'}</strong>：
                  {isZh ? '智能对话助手，支持多种AI模型' : 'Intelligent conversation assistant supporting multiple AI models'}
                </li>
                <li>
                  <strong>{isZh ? 'AI图像生成' : 'AI Image Generation'}</strong>：
                  {isZh ? '文本生成图像、图像编辑等视觉创作服务' : 'Text-to-image, image editing, and other visual creation services'}
                </li>
                <li>
                  <strong>{isZh ? 'AI视频生成' : 'AI Video Generation'}</strong>：
                  {isZh ? '文本或图像生成视频的自动化视频制作' : 'Automated video production from text or images'}
                </li>
                <li>
                  <strong>{isZh ? 'AI语音合成' : 'AI Text-to-Speech'}</strong>：
                  {isZh ? '文本转语音服务，生成自然流畅的语音' : 'Text-to-speech service generating natural and fluent voice'}
                </li>
                <li>
                  <strong>{isZh ? 'AI音乐生成' : 'AI Music Generation'}</strong>：
                  {isZh ? '根据提示词和歌词生成完整音乐作品' : 'Generate complete music compositions from prompts and lyrics'}
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {isZh ? '使用限制' : 'Usage Restrictions'}
              </h3>
              <p className="mb-4">
                {isZh ? '在使用我们的AI服务时，您不得：' : 'When using our AI services, you may not:'}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{isZh ? '生成非法、有害、威胁、辱骂、诽谤或侵犯他人权利的内容' : 'Generate illegal, harmful, threatening, abusive, defamatory, or rights-infringing content'}</li>
                <li>{isZh ? '生成虚假信息或误导性内容' : 'Generate false information or misleading content'}</li>
                <li>{isZh ? '侵犯任何第三方的知识产权' : 'Infringe on any third party\'s intellectual property'}</li>
                <li>{isZh ? '尝试逆向工程或破解我们的AI系统' : 'Attempt to reverse engineer or hack our AI systems'}</li>
                <li>{isZh ? '超过您订阅计划的使用限制' : 'Exceed the usage limits of your subscription plan'}</li>
                <li>{isZh ? '使用AI服务进行自动化批量操作以规避使用限制' : 'Use AI services for automated bulk operations to circumvent usage limits'}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {isZh ? '4. 内容所有权和知识产权' : '4. Content Ownership and Intellectual Property'}
              </h2>
              <p className="mb-4">
                <strong>{isZh ? '您的内容' : 'Your Content'}</strong>：
                {isZh ? '您保留对输入到我们AI系统中的原始内容的所有权利。' : 'You retain all rights to the original content you input into our AI systems.'}
              </p>
              <p className="mb-4">
                <strong>{isZh ? 'AI生成内容' : 'AI Generated Content'}</strong>：
                {isZh ? '通过我们的AI服务生成的内容版权归您所有。您可以自由使用、修改、分发和商业化这些内容。但请注意，您需要遵守相关法律法规和第三方AI模型提供商的使用条款。' : 'The copyright of content generated through our AI services belongs to you. You may freely use, modify, distribute, and commercialize this content. However, please note that you must comply with relevant laws and regulations and the terms of use of third-party AI model providers.'}
              </p>
              <p className="mb-4">
                <strong>{isZh ? '我们的知识产权' : 'Our Intellectual Property'}</strong>：
                {isZh ? 'MokerSaaS平台、网站设计、代码、算法和相关技术受知识产权法保护，归我们所有。' : 'The MokerSaaS platform, website design, code, algorithms, and related technologies are protected by intellectual property laws and belong to us.'}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {isZh ? '5. 付费服务和退款' : '5. Paid Services and Refunds'}
              </h2>
              <p className="mb-4">
                {isZh ? '我们提供免费和付费的AI服务。付费服务的具体条款包括：' : 'We offer both free and paid AI services. Specific terms for paid services include:'}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{isZh ? '所有价格以美元计算，可能因增值税而有所调整' : 'All prices are calculated in US dollars and may be adjusted for VAT'}</li>
                <li>{isZh ? '订阅费用按月收取，自动续费' : 'Subscription fees are charged monthly with automatic renewal'}</li>
                <li>{isZh ? '积分购买后立即生效，可用于各种AI服务' : 'Points are effective immediately after purchase and can be used for various AI services'}</li>
                <li>{isZh ? '您可以随时取消订阅，取消将在当前计费周期结束时生效' : 'You can cancel your subscription at any time, with cancellation taking effect at the end of the current billing cycle'}</li>
                <li>{isZh ? '我们提供7天无理由退款保证（仅限首次订阅）' : 'We offer a 7-day no-questions-asked refund guarantee (first-time subscriptions only)'}</li>
                <li>{isZh ? '已使用的积分和服务不可退款' : 'Used points and services are non-refundable'}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {isZh ? '6. 服务可用性' : '6. Service Availability'}
              </h2>
              <p className="mb-4">
                {isZh 
                  ? '我们努力保持服务的高可用性，但无法保证服务100%不间断。我们可能因维护、更新或其他技术原因暂停服务。我们会尽力提前通知用户计划中的维护。'
                  : 'We strive to maintain high service availability but cannot guarantee 100% uninterrupted service. We may suspend service for maintenance, updates, or other technical reasons. We will make every effort to notify users in advance of planned maintenance.'
                }
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {isZh ? '7. 免责声明' : '7. Disclaimer'}
              </h2>
              <p className="mb-4">
                {isZh
                  ? '我们的AI服务按"现状"提供。我们不保证AI生成内容的准确性、完整性或适用性。用户应对AI生成内容进行审查，并承担使用风险。'
                  : 'Our AI services are provided "as is". We do not guarantee the accuracy, completeness, or suitability of AI-generated content. Users should review AI-generated content and assume the risks of use.'
                }
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{isZh ? '我们不对AI生成内容的质量做任何保证' : 'We make no guarantees about the quality of AI-generated content'}</li>
                <li>{isZh ? '我们不对因使用AI生成内容而产生的任何损失负责' : 'We are not responsible for any losses arising from the use of AI-generated content'}</li>
                <li>{isZh ? '我们不保证服务不会出现错误或中断' : 'We do not guarantee that the service will be error-free or uninterrupted'}</li>
                <li>{isZh ? '第三方AI模型的可用性和性能可能会影响服务质量' : 'The availability and performance of third-party AI models may affect service quality'}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {isZh ? '8. 责任限制' : '8. Limitation of Liability'}
              </h2>
              <p className="mb-4">
                {isZh 
                  ? '在适用法律允许的最大范围内，我们对任何间接、偶然、特殊或后果性损害不承担责任。我们的总责任不超过您在过去12个月内支付给我们的费用。'
                  : 'To the maximum extent permitted by applicable law, we are not liable for any indirect, incidental, special, or consequential damages. Our total liability shall not exceed the fees you have paid to us in the past 12 months.'
                }
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {isZh ? '9. 条款修改' : '9. Terms Modification'}
              </h2>
              <p className="mb-4">
                {isZh 
                  ? '我们保留随时修改本服务条款的权利。如有重大变更，我们会提前30天通知用户。继续使用服务即表示您接受修改后的条款。'
                  : 'We reserve the right to modify these Terms of Service at any time. For significant changes, we will notify users 30 days in advance. Continued use of the service indicates your acceptance of the modified terms.'
                }
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {isZh ? '10. 法律适用' : '10. Governing Law'}
              </h2>
              <p className="mb-4">
                {isZh
                  ? '本服务条款受您所在司法管辖区的适用法律管辖。因本条款产生的争议应通过友好协商解决，协商不成的，提交至有管辖权的法院解决。'
                  : 'These Terms of Service are governed by the applicable laws of your jurisdiction. Disputes arising from these terms should be resolved through friendly negotiation. If negotiation fails, they shall be submitted to the competent court for resolution.'
                }
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {isZh ? '11. 联系我们' : '11. Contact Us'}
              </h2>
              <p className="mb-4">
                {isZh 
                  ? '如果您对本服务条款有任何疑问，请通过以下方式联系我们：'
                  : 'If you have any questions about these Terms of Service, please contact us through the following methods:'
                }
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{isZh ? '邮箱：app@itusi.cn' : 'Email: app@itusi.cn'}</li>
                <li>{isZh ? '网站：https://getsaas.co' : 'Website: https://getsaas.co'}</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
} 