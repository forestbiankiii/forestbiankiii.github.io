import Link from "next/link";
import { withBasePath } from "@/components/sitePath";
import {
  HU_LAB_PUBLICATION_CUTOFF,
  HU_LAB_PUBLICATIONS,
  type HuLabPublicationTopic,
} from "./publications";

const researchDirections = [
  {
    index: "01",
    title: "激光与材料相互作用",
    english: "Laser–matter interaction",
    body:
      "以飞秒激光为精密加工工具，在钙钛矿与聚合物体系中实现颜色、折射率、相态和微纳结构的可编程调控。",
  },
  {
    index: "02",
    title: "可重构光学神经网络",
    english: "Reconfigurable optical neural networks",
    body:
      "将材料响应与衍射计算结合，探索全光逻辑、全息推理、多功能衍射深度神经网络与片上光学智能。",
  },
  {
    index: "03",
    title: "光学与光电子器件",
    english: "Optical & optoelectronic devices",
    body:
      "面向全息显示、光学加密、神经形态视觉及宽谱光电探测，构建材料—器件—计算协同的微纳光子系统。",
  },
] as const;

const topicLabels: Record<HuLabPublicationTopic, string> = {
  "Optical AI": "光学智能",
  "Laser Patterning": "激光加工",
  "Photodetection & Materials": "材料与探测",
};

const publicationYears = Array.from(
  new Set(HU_LAB_PUBLICATIONS.map(({ year }) => year)),
);

export default function HuLabPage() {
  return (
    <main className="hu-lab-page">
      <nav className="hu-lab-nav" aria-label="课题组页面导航">
        <div className="hu-lab-shell hu-lab-nav__inner">
          <a className="hu-lab-brand" href="#top" aria-label="返回课题组主页顶部">
            <span className="hu-lab-brand__mark" aria-hidden="true">
              JH
            </span>
            <span>
              <strong>HU LAB</strong>
              <small>OPTICAL INTELLIGENCE</small>
            </span>
          </a>

          <div className="hu-lab-nav__links">
            <a href="#research">研究方向</a>
            <Link href={withBasePath("/academic/hu-lab/members")}>成员</Link>
            <a href="#publications">论文</a>
            <a href="#contact">联系</a>
          </div>

          <Link
            className="hu-lab-nav__back"
            href={withBasePath("/academic")}
          >
            汪懋林 · Academic
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </nav>

      <header id="top" className="hu-lab-hero">
        <div className="hu-lab-hero__grid" aria-hidden="true" />
        <div className="hu-lab-orbit hu-lab-orbit--one" aria-hidden="true" />
        <div className="hu-lab-orbit hu-lab-orbit--two" aria-hidden="true" />

        <div className="hu-lab-shell hu-lab-hero__inner">
          <div className="hu-lab-hero__copy">
            <p className="hu-lab-kicker">
              UNIVERSITY OF SHANGHAI FOR SCIENCE AND TECHNOLOGY
            </p>
            <h1>
              <span>胡津铭课题组</span>
              <em>Jinming Hu Research Group</em>
            </h1>
            <p className="hu-lab-hero__lead">
              以光写材料，<br />
              让材料参与计算。
            </p>
            <p className="hu-lab-hero__body">
              聚焦钙钛矿材料的激光加工及其在全息显示、光学人工智能与光电子器件中的应用。
              我们从材料响应出发，探索微纳尺度的光—物质交互与计算新范式。
            </p>
            <div className="hu-lab-hero__actions">
              <a className="hu-lab-button hu-lab-button--primary" href="#publications">
                浏览全部论文 <span aria-hidden="true">↓</span>
              </a>
              <a
                className="hu-lab-button hu-lab-button--ghost"
                href="https://ipc.usst.edu.cn/2023/0921/c13964a306410/page.htm"
                target="_blank"
                rel="noreferrer"
              >
                上理工官方档案 <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          <aside className="hu-lab-profile" aria-label="胡津铭老师简介">
            <div className="hu-lab-profile__index">PRINCIPAL INVESTIGATOR · 01</div>
            <div className="hu-lab-profile__portrait-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={withBasePath("/hu-jinming.jpg")}
                alt="胡津铭老师证件照"
                className="hu-lab-profile__portrait"
              />
              <span className="hu-lab-profile__scanline" aria-hidden="true" />
            </div>
            <div className="hu-lab-profile__identity">
              <p>胡津铭 · Jinming Hu</p>
              <span>博士 · 上海理工大学智能科技学院</span>
            </div>
            <dl className="hu-lab-profile__facts">
              <div>
                <dt>研究领域</dt>
                <dd>钙钛矿光子学 / 光学 AI</dd>
              </div>
              <div>
                <dt>博士学位</dt>
                <dd>北京理工大学 · 凝聚态物理</dd>
              </div>
              <div>
                <dt>ORCID</dt>
                <dd>
                  <a
                    href="https://orcid.org/0000-0002-4372-4952"
                    target="_blank"
                    rel="noreferrer"
                  >
                    0000-0002-4372-4952 ↗
                  </a>
                </dd>
              </div>
              <div>
                <dt>邮箱</dt>
                <dd>
                  <a href="mailto:jmhu0101@usst.edu.cn">
                    jmhu0101@usst.edu.cn ↗
                  </a>
                </dd>
              </div>
              <div>
                <dt>学术主页</dt>
                <dd>
                  <a
                    href="https://scholar.google.co.uk/scholar?as_allsubj=all&amp;as_sauthors=%22Jinming+Hu%22&amp;hl=en&amp;num=10"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="在 Google Scholar 查找胡津铭老师的论文"
                  >
                    Google Scholar ↗
                  </a>
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </header>

      <section className="hu-lab-metrics" aria-label="课题组论文统计">
        <div className="hu-lab-shell hu-lab-metrics__grid">
          <div>
            <strong>{HU_LAB_PUBLICATIONS.length}</strong>
            <span>篇上理工署名期刊论文</span>
          </div>
          <div>
            <strong>10</strong>
            <span>在读学生</span>
          </div>
          <div>
            <strong>03</strong>
            <span>核心研究方向</span>
          </div>
          <div>
            <strong>05</strong>
            <span>连续发表年份 · 2022—2026</span>
          </div>
        </div>
      </section>

      <section className="hu-lab-visual" aria-labelledby="hu-lab-visual-title">
        <div className="hu-lab-shell hu-lab-visual__inner">
          <div className="hu-lab-visual__heading">
            <p>FROM OUR RESEARCH / 代表作</p>
            <h2 id="hu-lab-visual-title">让超薄材料承载光学智能</h2>
            <span>
              通过亚 10 nm 二维钙钛矿纳米薄膜与飞秒激光图案化，实现波长复用全息显示和多任务光学神经网络。
            </span>
          </div>

          <figure className="hu-lab-paper-figure">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withBasePath("/hu-lab-representative-work.jpg")}
              alt="胡津铭共同第一作者代表作：二维钙钛矿纳米薄膜中的波长复用全息与多任务光学神经网络"
            />
            <figcaption>
              <span>REPRESENTATIVE WORK · CO-FIRST AUTHOR</span>
              <p>
                <strong>胡津铭</strong>、祝圣亭共同第一作者 · <em>Laser &amp; Photonics Reviews</em> 19(5), 2401458
              </p>
              <div>
                <a
                  href="https://doi.org/10.1002/lpor.202401458"
                  target="_blank"
                  rel="noreferrer"
                >
                  DOI 10.1002/lpor.202401458 ↗
                </a>
                <a
                  href="https://ipc.usst.edu.cn/2024/1216/c12794a331872/page.htm"
                  target="_blank"
                  rel="noreferrer"
                >
                  图源：上海理工大学光子芯片研究院成果报道 ↗
                </a>
              </div>
            </figcaption>
          </figure>
        </div>
      </section>

      <section id="research" className="hu-lab-section hu-lab-research">
        <div className="hu-lab-shell">
          <div className="hu-lab-section-heading">
            <p>RESEARCH AXES / 研究方向</p>
            <h2>从材料调控到光学计算</h2>
            <span>
              三条主线共享同一个目标：让材料、器件与算法在光场中共同完成信息处理。
            </span>
          </div>

          <div className="hu-lab-research__grid">
            {researchDirections.map((direction) => (
              <article key={direction.index} className="hu-lab-research-card">
                <span className="hu-lab-research-card__index">
                  {direction.index}
                </span>
                <div>
                  <p>{direction.english}</p>
                  <h3>{direction.title}</h3>
                  <span>{direction.body}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="publications" className="hu-lab-section hu-lab-publications">
        <div className="hu-lab-shell">
          <div className="hu-lab-section-heading hu-lab-section-heading--publications">
            <div>
              <p>PUBLICATION ARCHIVE / 论文全录</p>
              <h2>在上海理工大学发表</h2>
            </div>
            <span>
              按论文在线发表年份排序 · 胡津铭老师姓名以荧光色标出 · 点击 DOI
              进入出版社页面
            </span>
          </div>

          <div className="hu-lab-publication-groups">
            {publicationYears.map((year) => {
              const publications = HU_LAB_PUBLICATIONS.filter(
                (publication) => publication.year === year,
              );

              return (
                <section key={year} className="hu-lab-publication-year">
                  <div className="hu-lab-publication-year__rail">
                    <strong>{year}</strong>
                    <span>{String(publications.length).padStart(2, "0")} PAPERS</span>
                  </div>

                  <ol className="hu-lab-publication-list">
                    {publications.map((publication, index) => (
                      <li
                        key={publication.doi}
                        className={
                          publication.featured
                            ? "hu-lab-publication hu-lab-publication--featured"
                            : "hu-lab-publication"
                        }
                      >
                        <span className="hu-lab-publication__number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="hu-lab-publication__content">
                          <div className="hu-lab-publication__meta">
                            <span>{topicLabels[publication.topic]}</span>
                            {publication.featured ? <em>SELECTED</em> : null}
                          </div>
                          <h3>{publication.title}</h3>
                          <p className="hu-lab-publication__authors">
                            {publication.authors.split("Jinming Hu").map((part, partIndex, all) => (
                              <span key={`${publication.doi}-${partIndex}`}>
                                {part}
                                {partIndex < all.length - 1 ? (
                                  <strong>Jinming Hu</strong>
                                ) : null}
                              </span>
                            ))}
                          </p>
                          <p className="hu-lab-publication__venue">
                            {publication.venue}
                          </p>
                        </div>
                        <a
                          className="hu-lab-publication__doi"
                          href={`https://doi.org/${publication.doi}`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`打开论文 DOI：${publication.title}`}
                        >
                          <span>DOI</span>
                          <strong>{publication.doi}</strong>
                          <i aria-hidden="true">↗</i>
                        </a>
                      </li>
                    ))}
                  </ol>
                </section>
              );
            })}
          </div>

          <aside className="hu-lab-evidence">
            <div className="hu-lab-evidence__mark" aria-hidden="true">
              ✓
            </div>
            <div>
              <p>收录口径与完整性说明</p>
              <h3>以论文中的作者单位为准，而不是只按发表年份推断。</h3>
              <span>
                本页收录胡津铭老师作者单位明确包含“University of Shanghai for
                Science and Technology / 上海理工大学”的正式期刊论文，截止日期为
                {HU_LAB_PUBLICATION_CUTOFF}。已排除同名作者、北理工时期论文、重复的
                SSRN 预印本、书籍章节、数据附件及未正式发表手稿。论文信息由上理工官方教师档案、
                ORCID、出版社 DOI 页面、ResearchGate 与 OpenAlex 交叉核验。
              </span>
            </div>
            <div className="hu-lab-evidence__links">
              <a
                href="https://ipc.usst.edu.cn/2023/0921/c13964a306410/page.htm"
                target="_blank"
                rel="noreferrer"
              >
                上理工教师档案 ↗
              </a>
              <a
                href="https://orcid.org/0000-0002-4372-4952"
                target="_blank"
                rel="noreferrer"
              >
                ORCID 记录 ↗
              </a>
              <a
                href="https://www.researchgate.net/profile/Jinming-Hu-6"
                target="_blank"
                rel="noreferrer"
              >
                ResearchGate ↗
              </a>
            </div>
          </aside>
        </div>
      </section>

      <section id="contact" className="hu-lab-contact">
        <div className="hu-lab-contact__grid" aria-hidden="true" />
        <div className="hu-lab-shell hu-lab-contact__inner">
          <div>
            <p>CONTACT / 学术联系</p>
            <h2>让一束光，承担更多计算。</h2>
          </div>
          <div className="hu-lab-contact__details">
            <a href="mailto:jmhu0101@usst.edu.cn">
              jmhu0101@usst.edu.cn <span aria-hidden="true">↗</span>
            </a>
            <p>上海市杨浦区军工路 580 号 · 光电大楼</p>
            <p>上海理工大学 · 智能科技学院 / 光子芯片研究院</p>
          </div>
        </div>
      </section>

      <footer className="hu-lab-footer">
        <div className="hu-lab-shell hu-lab-footer__inner">
          <p>
            本页面为课题组学生维护的资料页 · DATA VERIFIED {HU_LAB_PUBLICATION_CUTOFF}
          </p>
          <Link href={withBasePath("/academic")}>返回汪懋林学术主页 ↑</Link>
        </div>
      </footer>
    </main>
  );
}
